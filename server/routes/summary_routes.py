from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
from config import Config
from models.summary_model import Summary
from middleware.jwt_middleware import token_required
from services.youtube_service import process_youtube_video
from services.pdf_service import process_pdf_file
from utils.text_cleaner import sanitize_input, calculate_word_count, calculate_reading_time
from pymongo import MongoClient
import tempfile

summary_bp = Blueprint('summary_bp', __name__)

ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@summary_bp.route('/youtube', methods=['POST'])
@token_required
def summarize_youtube(current_user):
    try:
        # Check if user can create another summary
        client = MongoClient(Config.MONGO_URI)
        db = client.pdf_summarizer
        from models.user_model import User
        user_model = User(db)
        
        if not user_model.can_create_summary(current_user['_id']):
            return jsonify({'message': 'Daily summary limit reached. Upgrade to premium for unlimited summaries.'}), 429
        
        data = request.get_json()
        
        if not data or 'video_link' not in data:
            return jsonify({'message': 'YouTube video link is required!'}), 400
        
        video_link = sanitize_input(data.get('video_link', '').strip())
        
        if not video_link:
            return jsonify({'message': 'Video link cannot be empty!'}), 400
        
        # Process the YouTube video
        result = process_youtube_video(video_link)
        
        if 'error' in result:
            return jsonify({'message': result['error']}), 400
        
        # Create summary record in database
        summary_model = Summary(db)
        summary_id = summary_model.create_summary(
            user_id=current_user['_id'],
            summary_type='youtube',
            original_source=video_link,
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
        
    except Exception as e:
        return jsonify({'message': f'Error generating YouTube summary: {str(e)}'}), 500


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