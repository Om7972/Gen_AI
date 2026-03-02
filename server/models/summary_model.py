from datetime import datetime
from bson import ObjectId
import logging
import hashlib

logger = logging.getLogger(__name__)


class Summary:
    def __init__(self, db):
        self.collection = db.summaries
        self._create_indexes()
    
    def _create_indexes(self):
        """Create indexes for optimal query performance"""
        try:
            # Index on user_id for fast user-specific queries
            self.collection.create_index('user_id')
            # Index on created_at for sorting (descending)
            self.collection.create_index([('created_at', -1)])
            # Index on type for filtering
            self.collection.create_index('type')
            # Compound index for common queries (user + type + date)
            self.collection.create_index([('user_id', 1), ('type', 1), ('created_at', -1)])
            # Index on video_id for caching lookup
            self.collection.create_index('video_id')
            # Text index for search functionality
            self.collection.create_index([('original_source', 'text'), ('extracted_text', 'text')])
            logger.info("Summary collection indexes created successfully")
        except Exception as e:
            logger.error(f"Error creating summary indexes: {str(e)}")
    
    def _extract_video_id(self, url):
        """Extract YouTube video ID from URL for caching"""
        import re
        patterns = [
            r'(?:youtube\.com/watch\?v=|youtu\.be/)([^&\s]+)',
            r'youtube\.com/embed/([^&\s]+)',
            r'youtube\.com/v/([^&\s]+)'
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None
    
    def create_summary(self, user_id, summary_type, original_source, extracted_text, summary_text):
        """Create a summary with optimized schema including video_id and length fields"""
        try:
            # Extract video_id for YouTube videos (for caching)
            video_id = None
            if summary_type == 'youtube':
                video_id = self._extract_video_id(original_source)
            
            # Calculate lengths
            text_length = len(extracted_text) if extracted_text else 0
            summary_length = len(summary_text) if summary_text else 0
            word_count = len(summary_text.split()) if summary_text else 0
            reading_time = round(word_count / 200) if summary_text else 0
            
            # Create content hash for duplicate detection
            content_hash = hashlib.md5(
                f"{summary_type}:{original_source}:{summary_text[:100]}".encode()
            ).hexdigest()
            
            summary_data = {
                'user_id': user_id,
                'type': summary_type,  # 'youtube' or 'pdf'
                'original_source': original_source,
                'video_id': video_id,  # Null for PDFs
                'extracted_text': extracted_text,
                'summary_text': summary_text,
                'created_at': datetime.utcnow(),
                'word_count': word_count,
                'reading_time': reading_time,
                'text_length': text_length,
                'summary_length': summary_length,
                'content_hash': content_hash
            }
            result = self.collection.insert_one(summary_data)
            logger.info(f"Summary created: {result.inserted_id} for user {user_id}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error creating summary: {str(e)}")
            raise
    
    def get_user_summaries(self, user_id, summary_type=None):
        query = {'user_id': user_id}
        if summary_type:
            query['type'] = summary_type
        # Use index on user_id + type + created_at for optimal performance
        summaries = list(self.collection.find(query).sort('created_at', -1))
        for summary in summaries:
            summary['_id'] = str(summary['_id'])
            summary['user_id'] = str(summary['user_id'])
        return summaries
    
    def find_by_video_id(self, video_id):
        """Find existing summary by video ID for caching"""
        try:
            if not video_id:
                return None
            # Use index on video_id
            summary_doc = self.collection.find_one({'video_id': video_id})
            if summary_doc:
                summary_doc['_id'] = str(summary_doc['_id'])
                summary_doc['user_id'] = str(summary_doc['user_id'])
                logger.info(f"Cache hit for video_id: {video_id}")
                return summary_doc
            logger.info(f"Cache miss for video_id: {video_id}")
            return None
        except Exception as e:
            logger.error(f"Error finding summary by video_id: {str(e)}")
            return None
    
    def find_by_content_hash(self, content_hash):
        """Find existing summary by content hash for duplicate detection"""
        try:
            summary_doc = self.collection.find_one({'content_hash': content_hash})
            if summary_doc:
                summary_doc['_id'] = str(summary_doc['_id'])
                summary_doc['user_id'] = str(summary_doc['user_id'])
                logger.info(f"Duplicate content detected with hash: {content_hash}")
                return summary_doc
            return None
        except Exception as e:
            logger.error(f"Error finding summary by content_hash: {str(e)}")
            return None
    
    def get_summary_by_id(self, summary_id, user_id):
        if not ObjectId.is_valid(summary_id):
            return None
        summary_doc = self.collection.find_one({
            '_id': ObjectId(summary_id),
            'user_id': user_id
        })
        if summary_doc:
            summary_doc['_id'] = str(summary_doc['_id'])
            summary_doc['user_id'] = str(summary_doc['user_id'])
            return summary_doc
        return None
    
    def delete_summary(self, summary_id, user_id):
        if not ObjectId.is_valid(summary_id):
            return False
        result = self.collection.delete_one({
            '_id': ObjectId(summary_id),
            'user_id': user_id
        })
        return result.deleted_count > 0