from flask import Blueprint, request, jsonify
import jwt
import bcrypt
from datetime import datetime, timedelta
from config import Config
from models.user_model import User
from pymongo import MongoClient
from utils.text_cleaner import sanitize_input

auth_bp = Blueprint('auth_bp', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not all(k in data for k in ('name', 'email', 'password')):
            return jsonify({'message': 'Name, email, and password are required!'}), 400
        
        name = sanitize_input(data.get('name', '').strip())
        email = sanitize_input(data.get('email', '').strip().lower())
        password = data.get('password', '')
        
        # Validation
        if not name or len(name) < 2:
            return jsonify({'message': 'Name must be at least 2 characters long!'}), 400
        
        if not email or '@' not in email:
            return jsonify({'message': 'Valid email is required!'}), 400
        
        if not password or len(password) < 6:
            return jsonify({'message': 'Password must be at least 6 characters long!'}), 400
        
        # Connect to MongoDB
        client = MongoClient(Config.MONGO_URI)
        db = client.pdf_summarizer
        user_model = User(db)
        
        # Check if user already exists
        existing_user = user_model.find_by_email(email)
        if existing_user:
            return jsonify({'message': 'User with this email already exists!'}), 409
        
        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Create the user
        user_id = user_model.create_user(name, email, hashed_password.decode('utf-8'))
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(seconds=Config.JWT_ACCESS_TOKEN_EXPIRES)
        }, Config.JWT_SECRET_KEY, algorithm="HS256")
        
        client.close()
        
        return jsonify({
            'message': 'User registered successfully!',
            'token': token,
            'user': {
                'id': user_id,
                'name': name,
                'email': email
            }
        }), 201
        
    except Exception as e:
        return jsonify({'message': f'Registration failed: {str(e)}'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not all(k in data for k in ('email', 'password')):
            return jsonify({'message': 'Email and password are required!'}), 400
        
        email = sanitize_input(data.get('email', '').strip().lower())
        password = data.get('password', '')
        
        # Validation
        if not email or '@' not in email:
            return jsonify({'message': 'Valid email is required!'}), 400
        
        if not password:
            return jsonify({'message': 'Password is required!'}), 400
        
        # Connect to MongoDB
        client = MongoClient(Config.MONGO_URI)
        db = client.pdf_summarizer
        user_model = User(db)
        
        # Find user by email
        user = user_model.find_by_email(email)
        if not user:
            return jsonify({'message': 'Invalid credentials!'}), 401
        
        # Check password
        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({'message': 'Invalid credentials!'}), 401
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user['_id'],
            'exp': datetime.utcnow() + timedelta(seconds=Config.JWT_ACCESS_TOKEN_EXPIRES)
        }, Config.JWT_SECRET_KEY, algorithm="HS256")
        
        client.close()
        
        return jsonify({
            'message': 'Login successful!',
            'token': token,
            'user': {
                'id': user['_id'],
                'name': user['name'],
                'email': user['email'],
                'is_premium': user.get('is_premium', False)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Login failed: {str(e)}'}), 500


@auth_bp.route('/profile', methods=['GET'])
def profile():
    try:
        # This route will be protected by middleware (token_required decorator)
        # The token validation and user retrieval will be handled by the middleware
        # For now, we'll just return a placeholder - the actual implementation 
        # will be in the main server file with the token_required decorator
        pass
    except Exception as e:
        return jsonify({'message': f'Profile retrieval failed: {str(e)}'}), 500