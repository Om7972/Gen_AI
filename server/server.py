import os
os.environ["KMP_DUPLICATE_LIB_OK"]="TRUE"
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt
from datetime import datetime, timedelta
from config import Config
from routes.auth_routes import auth_bp
from routes.summary_routes import summary_bp
from middleware.jwt_middleware import token_required
from models.user_model import User
from pymongo import MongoClient
import logging


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    
    # Enable CORS for all routes
    CORS(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(summary_bp, url_prefix='/api/summarize')
    
    # Profile route (protected)
    @app.route('/api/auth/profile', methods=['GET'])
    @token_required
    def profile(current_user):
        try:
            # Connect to MongoDB to get fresh user data
            client = MongoClient(Config.MONGO_URI)
            db = client.pdf_summarizer
            user_model = User(db)
            
            # Get fresh user data
            fresh_user = user_model.find_by_id(current_user['_id'])
            
            client.close()
            
            if not fresh_user:
                return jsonify({'message': 'User not found!'}), 404
            
            return jsonify({
                'user': {
                    'id': fresh_user['_id'],
                    'name': fresh_user['name'],
                    'email': fresh_user['email'],
                    'is_premium': fresh_user.get('is_premium', False),
                    'daily_limit': fresh_user.get('daily_limit', 5),
                    'summaries_count_today': fresh_user.get('summaries_count_today', 0),
                    'created_at': fresh_user['created_at']
                }
            }), 200
        except Exception as e:
            return jsonify({'message': f'Error retrieving profile: {str(e)}'}), 500
    
    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()}), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'message': 'Endpoint not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'message': 'Internal server error'}), 500
    
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='127.0.0.1', port=5000)