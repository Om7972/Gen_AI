from functools import wraps
from flask import request, jsonify
import jwt
from config import Config
from models.user_model import User
from pymongo import MongoClient


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check for token in Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({'message': 'Token format invalid. Use: Bearer <token>'}), 401
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            # Decode the token
            data = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=["HS256"])
            current_user_id = data['user_id']
            
            # Connect to MongoDB to verify user exists
            client = MongoClient(Config.MONGO_URI)
            db = client.pdf_summarizer
            user_model = User(db)
            current_user = user_model.find_by_id(current_user_id)
            
            if not current_user:
                return jsonify({'message': 'Token is invalid! User not found.'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token is invalid!'}), 401
        except Exception as e:
            return jsonify({'message': f'Error decoding token: {str(e)}'}), 500

        return f(current_user, *args, **kwargs)

    return decorated