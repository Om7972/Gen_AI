from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
import time
import logging
from config import Config
from models.summary_model import Summary
from middleware.jwt_middleware import token_required
from services.youtube_service import process_youtube_video
from services.pdf_service import process_pdf_file
from utils.text_cleaner import sanitize_input, calculate_word_count, calculate_reading_time
from pymongo import MongoClient
import tempfile
from utils.cache import cache_youtube_summary, get_cached_youtube_summary, SummarizationLogger
from utils.error_handler import handle_error, AppError, ValidationError, NotFoundError, success_response, error_response
from schemas.validation_schemas import YouTubeSummarySchema, validate_request_data

summary_bp = Blueprint('summary_bp', __name__)
logger = logging.getLogger(__name__)
sum_logger = SummarizationLogger(logger)

ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@summary_bp.route('/youtube', methods=['POST'])
@token_required
def summarize_youtube(current_user):
    start_time = time.time()
    
    try:
        # Validate request data
        data = request.get_json()
        if not data or 'video_link' not in data:
            raise ValidationError('YouTube video link is required')
        
        validated_data, errors = validate_request_data(data, YouTubeSummarySchema())
        if errors:
            raise ValidationError('Validation failed', errors=errors)
        
        video_link = sanitize_input(validated_data['video_link'].strip())
        
        # Connect to MongoDB
        client = MongoClient(Config.MONGO_URI)
        db = client.pdf_summarizer
        user_model = User(db)
        summary_model = Summary(db)
        
        # Check if user can create another summary
        if not user_model.can_create_summary(current_user['_id']):
            client.close()
            sum_logger.log_rate_limit_warning(
                current_user['_id'],
                user_model.find_by_id(current_user['_id']).get('summaries_count_today', 0),
                user_model.find_by_id(current_user['_id']).get('daily_limit', 5)
            )
            raise AppError(
                'Daily summary limit reached. Upgrade to premium for unlimited summaries.',
                status_code=429
            )
        
        # Extract video ID for caching
        video_id = summary_model._extract_video_id(video_link)
        
        # Check cache first
        if video_id:
            cached_summary = get_cached_youtube_summary(video_id)
            if cached_summary:
                sum_logger.log_cache_hit('youtube', video_id)
                client.close()
                return success_response(
                    data=cached_summary,
                    message='Summary retrieved from cache',
                    meta={'cached': True}
                )
            sum_logger.log_cache_miss('youtube', video_id)
        
        # Log summarization start
        sum_logger.log_summarization_start(current_user['_id'], 'youtube', video_link)
        
        # Process the YouTube video
        result = process_youtube_video(video_link)
        
        if 'error' in result:
            client.close()
            raise AppError(result['error'], status_code=400)
        
        # Create summary record in database
        summary_id = summary_model.create_summary(
            user_id=current_user['_id'],
            summary_type='youtube',
            original_source=video_link,
            extracted_text=result.get('extracted_text', ''),
            summary_text=result['summary']
        )
        
        # Increment user's summary count
        user_model.increment_summary_count(current_user['_id'])
        
        # Cache the result
        if video_id:
            summary_data = {
                'summary': result['summary'],
                'summary_id': summary_id,
                'word_count': calculate_word_count(result['summary']),
                'reading_time': calculate_reading_time(result['summary']),
                'type': 'youtube'
            }
            cache_youtube_summary(video_id, summary_data, timeout=86400)  # 24 hours
        
        client.close()
        
        # Log completion
        duration = time.time() - start_time
        sum_logger.log_summarization_complete(
            current_user['_id'],
            'youtube',
            duration,
            calculate_word_count(result['summary'])
        )
        
        return success_response(
            data={
                'summary': result['summary'],
                'summary_id': summary_id,
                'word_count': calculate_word_count(result['summary']),
                'reading_time': calculate_reading_time(result['summary'])
            },
            message='Summary generated successfully!',
            meta={'duration_seconds': round(duration, 2)}
        )
        
    except (ValidationError, AppError) as e:
        return handle_error(e)
    except Exception as e:
        sum_logger.log_error('youtube_summarization', e, current_user['_id'])
        return handle_error(e)


@summary_bp.route('/pdf', methods=['POST'])
@token_required
def summarize_pdf(current_user):
    try:
        # Check if user can create another summary
        client = MongoClient(Config.MONGO_URI)
        db = client.pdf_summarizer
        from models.user_model import User
        user_model = User(db)
        
        if not user_model.can_create_summary(current_user['_id']):
            return jsonify({'message': 'Daily summary limit reached. Upgrade to premium for unlimited summaries.'}), 429
        
        # Check if the POST request has the file part
        if 'file' not in request.files:
            return jsonify({'message': 'No file part in the request!'}), 400

        file = request.files['file']

        # If user does not select file, browser also
        # submit an empty part without filename
        if file.filename == '':
            return jsonify({'message': 'No file selected!'}), 400

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            
            # Save file temporarily
            temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'temp_uploads')
            os.makedirs(temp_dir, exist_ok=True)
            file_path = os.path.join(temp_dir, filename)
            file.save(file_path)
            
            try:
                # Process the PDF file
                result = process_pdf_file(file_path)
                
                if 'error' in result:
                    return jsonify({'message': result['error']}), 400
                
                # Create summary record in database
                summary_model = Summary(db)
                summary_id = summary_model.create_summary(
                    user_id=current_user['_id'],
                    summary_type='pdf',
                    original_source=filename,
                    extracted_text=result.get('extracted_text', ''),
                    summary_text=result['summary']
                )
                
                # Increment user's summary count
                user_model.increment_summary_count(current_user['_id'])
                
                client.close()
                
                return jsonify({
                    'message': 'Summary generated successfully!',
                    'summary': result['summary'],
                    'summary_id': summary_id,
                    'word_count': calculate_word_count(result['summary']),
                    'reading_time': calculate_reading_time(result['summary'])
                }), 200
                
            finally:
                # Clean up temporary file
                if os.path.exists(file_path):
                    os.remove(file_path)
        else:
            return jsonify({'message': 'Invalid file type. Only PDF files are allowed.'}), 400

    except Exception as e:
        return jsonify({'message': f'Error processing PDF: {str(e)}'}), 500


@summary_bp.route('/history', methods=['GET'])
@token_required
def get_history(current_user):
    try:
        client = MongoClient(Config.MONGO_URI)
        db = client.pdf_summarizer
        summary_model = Summary(db)
        
        # Get optional type filter
        summary_type = request.args.get('type')
        
        summaries = summary_model.get_user_summaries(current_user['_id'], summary_type)
        
        client.close()
        
        return jsonify({
            'message': 'History retrieved successfully!',
            'summaries': summaries
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error retrieving history: {str(e)}'}), 500


@summary_bp.route('/<summary_id>', methods=['DELETE'])
@token_required
def delete_summary(current_user, summary_id):
    try:
        client = MongoClient(Config.MONGO_URI)
        db = client.pdf_summarizer
        summary_model = Summary(db)
        
        success = summary_model.delete_summary(summary_id, current_user['_id'])
        
        client.close()
        
        if success:
            return jsonify({'message': 'Summary deleted successfully!'}), 200
        else:
            return jsonify({'message': 'Summary not found or unauthorized!'}), 404
            
    except Exception as e:
        return jsonify({'message': f'Error deleting summary: {str(e)}'}), 500