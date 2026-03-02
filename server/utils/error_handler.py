"""
Centralized error handling and response formatting
Provides consistent JSON response structure across the application
"""

import logging
from functools import wraps
from flask import jsonify, current_app


class AppError(Exception):
    """Base application error class"""
    
    def __init__(self, message, status_code=400, payload=None):
        self.message = message
        self.status_code = status_code
        self.payload = payload or {}
        super().__init__(self.message)
    
    def to_dict(self):
        rv = dict(self.payload)
        rv['success'] = False
        rv['message'] = self.message
        return rv


class ValidationError(AppError):
    """Raised when request validation fails"""
    def __init__(self, message, errors=None):
        super().__init__(message, status_code=400)
        self.errors = errors or []
    
    def to_dict(self):
        rv = super().to_dict()
        rv['errors'] = self.errors
        return rv


class NotFoundError(AppError):
    """Raised when resource is not found"""
    def __init__(self, message='Resource not found'):
        super().__init__(message, status_code=404)


class UnauthorizedError(AppError):
    """Raised when user is not authenticated"""
    def __init__(self, message='Unauthorized access'):
        super().__init__(message, status_code=401)


class ForbiddenError(AppError):
    """Raised when user doesn't have permission"""
    def __init__(self, message='Access forbidden'):
        super().__init__(message, status_code=403)


class RateLimitError(AppError):
    """Raised when rate limit is exceeded"""
    def __init__(self, message='Rate limit exceeded'):
        super().__init__(message, status_code=429)


def handle_error(error):
    """
    Centralized error handler that formats all errors consistently
    
    Args:
        error: Exception instance
    
    Returns:
        Flask response with standardized JSON format
    """
    # Log the error
    log_error(error)
    
    # Handle custom AppError types
    if isinstance(error, AppError):
        return jsonify(error.to_dict()), error.status_code
    
    # Handle common exceptions
    if isinstance(error, ValueError):
        return jsonify({
            'success': False,
            'message': f'Invalid value: {str(error)}'
        }), 400
    
    if isinstance(error, KeyError):
        return jsonify({
            'success': False,
            'message': f'Missing required field: {str(error)}'
        }), 400
    
    # Default server error
    return jsonify({
        'success': False,
        'message': 'An unexpected error occurred. Please try again later.'
    }), 500


def log_error(error):
    """Log error with appropriate level"""
    logger = logging.getLogger(__name__)
    
    if isinstance(error, (ValidationError, NotFoundError)):
        logger.warning(f"Client error: {error.message}")
    elif isinstance(error, AppError):
        logger.error(f"Application error: {error.message}", exc_info=True)
    else:
        logger.error(f"Unexpected error: {str(error)}", exc_info=True)


def success_response(data=None, message='Success', status_code=200, meta=None):
    """
    Create a standardized success response
    
    Args:
        data: Response data (dict, list, or primitive)
        message: Success message
        status_code: HTTP status code
        meta: Additional metadata
    
    Returns:
        tuple: (jsonify_response, status_code)
    """
    response = {
        'success': True,
        'message': message
    }
    
    if data is not None:
        response['data'] = data
    
    if meta is not None:
        response['meta'] = meta
    
    return jsonify(response), status_code


def error_response(message, status_code=400, errors=None):
    """
    Create a standardized error response
    
    Args:
        message: Error message
        status_code: HTTP status code
        errors: List of validation errors
    
    Returns:
        tuple: (jsonify_response, status_code)
    """
    response = {
        'success': False,
        'message': message
    }
    
    if errors:
        response['errors'] = errors
    
    return jsonify(response), status_code


def validate_request(schema):
    """
    Decorator for validating request data against a Marshmallow schema
    
    Args:
        schema: Marshmallow schema instance
    
    Returns:
        Decorated function
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask import request
            from schemas.validation_schemas import validate_request_data
            
            # Get request data based on content type
            if request.is_json:
                data = request.get_json() or {}
            else:
                data = request.form.to_dict() if request.form else {}
            
            # Validate against schema
            validated_data, errors = validate_request_data(data, schema)
            
            if errors:
                raise ValidationError('Validation failed', errors=errors)
            
            # Add validated data to request context
            request.validated_data = validated_data
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator
