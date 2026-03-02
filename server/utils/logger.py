"""
Logging configuration module
Sets up structured logging with file and console handlers
"""

import logging
import os
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from datetime import datetime


def setup_logging(app):
    """
    Configure logging for the Flask application
    
    Args:
        app: Flask application instance
    """
    from config import Config
    
    # Create logs directory
    if Config.LOG_TO_FILE:
        log_dir = os.path.dirname(os.path.abspath(__file__))
        log_path = os.path.join(log_dir, '..', Config.LOG_FILE)
        os.makedirs(os.path.dirname(log_path), exist_ok=True)
    
    # Set root logger level
    logging.basicConfig(level=getattr(logging, Config.LOG_LEVEL.upper(), logging.INFO))
    
    # Create formatter
    formatter = logging.Formatter(Config.LOG_FORMAT)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(getattr(logging, Config.LOG_LEVEL.upper(), logging.INFO))
    console_handler.setFormatter(formatter)
    
    # File handler with rotation (10MB max per file)
    if Config.LOG_TO_FILE:
        file_handler = RotatingFileHandler(
            log_path,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=10,
            encoding='utf-8'
        )
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(formatter)
        app.logger.addHandler(file_handler)
    
    # Add console handler to app logger
    app.logger.addHandler(console_handler)
    app.logger.setLevel(getattr(logging, Config.LOG_LEVEL.upper(), logging.INFO))
    
    # Log application startup
    app.logger.info("=" * 80)
    app.logger.info(f"Application started at {datetime.utcnow().isoformat()}")
    app.logger.info(f"Log level: {Config.LOG_LEVEL}")
    app.logger.info(f"Environment: {'Production' if not app.debug else 'Development'}")
    app.logger.info("=" * 80)
    
    return app.logger


class SummarizationLogger:
    """Specialized logger for summarization operations"""
    
    def __init__(self, logger=None):
        self.logger = logger or logging.getLogger(__name__)
    
    def log_summarization_start(self, user_id, content_type, source):
        """Log start of summarization process"""
        self.logger.info(
            f"Summarization started | User: {user_id} | Type: {content_type} | Source: {source[:50]}..."
        )
    
    def log_summarization_complete(self, user_id, content_type, duration_seconds, word_count):
        """Log completion of summarization process"""
        self.logger.info(
            f"Summarization completed | User: {user_id} | "
            f"Type: {content_type} | Duration: {duration_seconds:.2f}s | "
            f"Words: {word_count}"
        )
    
    def log_extraction_complete(self, content_type, text_length, extraction_time):
        """Log content extraction metrics"""
        self.logger.info(
            f"Content extracted | Type: {content_type} | "
            f"Length: {text_length} chars | Time: {extraction_time:.2f}s"
        )
    
    def log_cache_hit(self, cache_type, key):
        """Log cache hit"""
        self.logger.info(f"Cache hit | Type: {cache_type} | Key: {key}")
    
    def log_cache_miss(self, cache_type, key):
        """Log cache miss"""
        self.logger.info(f"Cache miss | Type: {cache_type} | Key: {key}")
    
    def log_rate_limit_warning(self, user_id, current_count, limit):
        """Log rate limit warning"""
        self.logger.warning(
            f"Rate limit approaching | User: {user_id} | "
            f"Count: {current_count}/{limit}"
        )
    
    def log_error(self, operation, error, user_id=None):
        """Log error with context"""
        self.logger.error(
            f"Error in {operation} | User: {user_id} | Error: {str(error)}",
            exc_info=True
        )
