import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-here'
    MONGO_URI = os.environ.get('MONGO_URI') or 'mongodb://localhost:27017/pdf_summarizer'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-string'
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    RATE_LIMIT_REQUESTS = 10
    RATE_LIMIT_WINDOW = 3600  # 1 hour