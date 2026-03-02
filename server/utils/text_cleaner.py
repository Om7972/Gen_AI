import re


def clean_text(text):
    """
    Clean and normalize text
    """
    if not text:
        return ""
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove special characters but keep punctuation
    text = re.sub(r'[^\w\s\.\,\!\?\;\:\-\(\)]', ' ', text)
    
    # Normalize whitespace
    text = ' '.join(text.split())
    
    return text.strip()


def sanitize_input(input_text):
    """
    Sanitize user inputs to prevent injection attacks
    """
    if not input_text:
        return ""
    
    # Remove potentially harmful characters/sequences
    sanitized = re.sub(r'[<>"\';]', '', input_text)
    
    return sanitized.strip()


def calculate_reading_time(text):
    """
    Calculate approximate reading time in minutes (~200 words per minute)
    """
    if not text:
        return 0
    
    word_count = len(text.split())
    reading_time = max(1, round(word_count / 200))  # At least 1 minute
    return reading_time


def calculate_word_count(text):
    """
    Calculate word count
    """
    if not text:
        return 0
    
    return len(text.split())