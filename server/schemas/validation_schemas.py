"""
Marshmallow schemas for request validation and serialization
Provides robust input validation with clear error messages
"""

from marshmallow import Schema, fields, validates, validates_schema, ValidationError
import re


class YouTubeSummarySchema(Schema):
    """Schema for YouTube summarization requests"""
    video_link = fields.Str(required=True, strip=True)
    
    @validates('video_link')
    def validate_youtube_url(self, value):
        """Validate YouTube URL format"""
        if not value:
            raise ValidationError('YouTube URL cannot be empty')
        
        # YouTube URL patterns
        youtube_patterns = [
            r'^(https?://)?(www\.)?(youtube\.com/watch\?v=[a-zA-Z0-9_-]{11})',
            r'^(https?://)?(youtu\.be/)[a-zA-Z0-9_-]{11}',
            r'^(https?://)?(www\.)?(youtube\.com/embed/)[a-zA-Z0-9_-]{11}',
            r'^(https?://)?(www\.)?(youtube\.com/v/)[a-zA-Z0-9_-]{11}'
        ]
        
        is_valid = any(re.match(pattern, value) for pattern in youtube_patterns)
        
        if not is_valid:
            raise ValidationError(
                'Invalid YouTube URL format. Please use a valid YouTube video URL.'
            )


class PDFUploadSchema(Schema):
    """Schema for PDF upload validation (metadata only, file handled separately)"""
    # File validation is done in route due to multipart/form-data
    pass


class RegisterUserSchema(Schema):
    """Schema for user registration"""
    name = fields.Str(required=True, strip=True)
    email = fields.Email(required=True, strip=True)
    password = fields.Str(required=True, load_only=True)
    
    @validates('name')
    def validate_name(self, value):
        """Validate name field"""
        if len(value) < 2:
            raise ValidationError('Name must be at least 2 characters long')
        if len(value) > 100:
            raise ValidationError('Name must be less than 100 characters long')
        if not re.match(r'^[\w\s\-\.]+$', value):
            raise ValidationError('Name contains invalid characters')
    
    @validates('password')
    def validate_password(self, value):
        """Validate password strength"""
        if len(value) < 8:
            raise ValidationError('Password must be at least 8 characters long')
        if len(value) > 128:
            raise ValidationError('Password must be less than 128 characters long')
        if not re.search(r'[A-Z]', value):
            raise ValidationError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', value):
            raise ValidationError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', value):
            raise ValidationError('Password must contain at least one number')


class LoginUserSchema(Schema):
    """Schema for user login"""
    email = fields.Email(required=True, strip=True)
    password = fields.Str(required=True, load_only=True)


class SummaryIdSchema(Schema):
    """Schema for summary ID validation"""
    summary_id = fields.Str(required=True)
    
    @validates('summary_id')
    def validate_summary_id(self, value):
        """Validate MongoDB ObjectId format"""
        from bson import ObjectId
        if not ObjectId.is_valid(value):
            raise ValidationError('Invalid summary ID format')


# Utility functions
def validate_request_data(data, schema):
    """
    Validate request data against a schema
    
    Args:
        data: Dictionary of request data
        schema: Marshmallow schema instance
    
    Returns:
        tuple: (validated_data, errors)
    """
    try:
        validated_data = schema.load(data)
        return validated_data, None
    except ValidationError as err:
        return None, err.messages


def sanitize_string(value):
    """
    Sanitize string input by removing potentially harmful characters
    
    Args:
        value: String to sanitize
    
    Returns:
        str: Sanitized string
    """
    if not isinstance(value, str):
        return value
    
    # Remove HTML tags
    clean = re.sub(r'<[^>]+>', '', value)
    # Remove script tags and their content
    clean = re.sub(r'<script.*?</script>', '', clean, flags=re.IGNORECASE | re.DOTALL)
    # Remove javascript: protocol
    clean = re.sub(r'javascript:', '', clean, flags=re.IGNORECASE)
    # Limit length
    if len(clean) > 10000:
        clean = clean[:10000]
    
    return clean.strip()
