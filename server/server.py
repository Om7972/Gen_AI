import os
os.environ["KMP_DUPLICATE_LIB_OK"]="TRUE"
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import jwt
from datetime import datetime, timedelta
from config import Config
from routes.auth_routes import auth_bp
from routes.summary_routes import summary_bp
from middleware.jwt_middleware import token_required
from models.user_model import User
from pymongo import MongoClient
from utils.logger import setup_logging, SummarizationLogger
from utils.cache import cache_manager
from utils.error_handler import handle_error, AppError, NotFoundError
import logging


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Set up logging
    logger = setup_logging(app)
    
    # Initialize cache manager
    cache_manager.init_app(app)
    
    # Enable CORS for all routes
    CORS(app)
    
    # Initialize rate limiter
    if Config.RATE_LIMIT_ENABLED:
        limiter = Limiter(
            key_func=get_remote_address,
            app=app,
            default_limits=[Config.RATE_LIMIT_DEFAULT],
            storage_uri=Config.RATE_LIMIT_STORAGE_URL,
            strategy="fixed-window"
        )
        logger.info(f"Rate limiting enabled: {Config.RATE_LIMIT_DEFAULT}")
    else:
        logger.warning("Rate limiting disabled")
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(summary_bp, url_prefix='/api/summarize')
    
    # Profile route (protected)
    @app.route('/api/auth/profile', methods=['GET'])
    @token_required
    def profile(current_user):
        try:
            logger = logging.getLogger(__name__)
            
            # Try to get from cache first
            cached_profile = cache_manager.get_cached_user_profile(current_user['_id'])
            if cached_profile:
                logger.info(f"Profile cache hit for user {current_user['_id']}")
                return jsonify({
                    'success': True,
                    'user': cached_profile
                }), 200
            
            # Connect to MongoDB to get fresh user data
            client = MongoClient(Config.MONGO_URI)
            db = client.pdf_summarizer
            user_model = User(db)
            
            # Get fresh user data
            fresh_user = user_model.find_by_id(current_user['_id'])
            client.close()
            
            if not fresh_user:
                raise NotFoundError('User not found')
            
            # Prepare user data
            user_data = {
                'id': fresh_user['_id'],
                'name': fresh_user['name'],
                'email': fresh_user['email'],
                'is_premium': fresh_user.get('is_premium', False),
                'daily_limit': fresh_user.get('daily_limit', 5),
                'summaries_count_today': fresh_user.get('summaries_count_today', 0),
                'created_at': fresh_user['created_at']
            }
            
            # Cache the profile
            cache_manager.cache_user_profile(current_user['_id'], user_data, timeout=3600)
            
            return jsonify({
                'success': True,
                'user': user_data
            }), 200
            
        except NotFoundError as e:
            return handle_error(e)
        except Exception as e:
            return handle_error(e)
    
    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()}), 200
    
    # Error handlers with centralized formatting
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'message': 'Endpoint not found'
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            'success': False,
            'message': 'Internal server error. Please try again later.'
        }), 500
    
    @app.errorhandler(429)
    def ratelimit_handler(error):
        return jsonify({
            'success': False,
            'message': 'Rate limit exceeded. Please slow down.'
        }), 429
    
    # Global exception handler
    @app.errorhandler(Exception)
    def handle_exception(error):
        """Global exception handler for unhandled errors"""
        return handle_error(error)
    
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='127.0.0.1', port=5000)