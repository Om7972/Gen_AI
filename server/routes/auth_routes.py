from flask import Blueprint, request, jsonify
import jwt
import bcrypt
from datetime import datetime, timedelta
from config import Config
from models.user_model import User
from pymongo import MongoClient
from utils.text_cleaner import sanitize_input
from utils.error_handler import handle_error, AppError, ValidationError, NotFoundError, UnauthorizedError, success_response

auth_bp = Blueprint('auth_bp', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not all(k in data for k in ('name', 'email', 'password')):
            raise ValidationError('Name, email, and password are required!')
        
        name = sanitize_input(data.get('name', '').strip())
        email = sanitize_input(data.get('email', '').strip().lower())
        password = data.get('password', '')
        
        # Validation
        if not name or len(name) < 2:
            raise ValidationError('Name must be at least 2 characters long!')
        
        if not email or '@' not in email:
            raise ValidationError('Valid email is required!')
        
        if not password or len(password) < 6:
            raise ValidationError('Password must be at least 6 characters long!')
        
        # Connect to MongoDB
        client = MongoClient(Config.MONGO_URI)
        db = client.pdf_summarizer
        user_model = User(db)
        
        # Check if user already exists
        existing_user = user_model.find_by_email(email)
        if existing_user:
            client.close()
            raise AppError('User with this email already exists!', status_code=409)
        
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
        
        return success_response(
            data={
                'token': token,
                'user': {
                    'id': user_id,
                    'name': name,
                    'email': email
                }
            },
            message='User registered successfully!',
            status_code=201
        )
        
    except (ValidationError, AppError) as e:
        return handle_error(e)
    except Exception as e:
        return handle_error(e)


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not all(k in data for k in ('email', 'password')):
            raise ValidationError('Email and password are required!')
        
        email = sanitize_input(data.get('email', '').strip().lower())
        password = data.get('password', '')
        
        # Validation
        if not email or '@' not in email:
            raise ValidationError('Valid email is required!')
        
        if not password:
            raise ValidationError('Password is required!')
        
        # Connect to MongoDB
        client = MongoClient(Config.MONGO_URI)
        db = client.pdf_summarizer
        user_model = User(db)
        
        # Find user by email
        user = user_model.find_by_email(email)
        if not user:
            client.close()
            raise UnauthorizedError('Invalid credentials!')
        
        # Check password
        password_hash = user['password_hash']
        if isinstance(password_hash, str):
            password_hash = password_hash.encode('utf-8')
            
        if not bcrypt.checkpw(password.encode('utf-8'), password_hash):
            client.close()
            raise UnauthorizedError('Invalid credentials!')
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user['_id'],
            'exp': datetime.utcnow() + timedelta(seconds=Config.JWT_ACCESS_TOKEN_EXPIRES)
        }, Config.JWT_SECRET_KEY, algorithm="HS256")
        
        client.close()
        
        return success_response(
            data={
                'token': token,
                'user': {
                    'id': user['_id'],
                    'name': user['name'],
                    'email': user['email'],
                    'is_premium': user.get('is_premium', False)
                }
            },
            message='Login successful!'
        )
        
    except (ValidationError, AppError) as e:
        return handle_error(e)
    except Exception as e:
        return handle_error(e)


@auth_bp.route('/profile', methods=['GET'])
def profile():
    try:
        # This route will be protected by middleware (token_required decorator)
        # The token validation and user retrieval will be handled by the middleware
        # For now, we'll just return a placeholder - the actual implementation 
        # will be in the main server file with the token_required decorator
        pass
    except (ValidationError, AppError) as e:
        return handle_error(e)
    except Exception as e:
        return handle_error(e)