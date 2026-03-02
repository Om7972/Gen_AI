from datetime import datetime
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)


class User:
    def __init__(self, db):
        self.collection = db.users
        self._create_indexes()
    
    def _create_indexes(self):
        """Create indexes for optimal query performance"""
        try:
            # Index on email for fast lookups
            self.collection.create_index('email', unique=True)
            # Compound index for daily limit checks
            self.collection.create_index([('email', 1), ('is_premium', 1)])
            logger.info("User collection indexes created successfully")
        except Exception as e:
            logger.error(f"Error creating user indexes: {str(e)}")
    
    def create_user(self, name, email, password_hash):
        user_data = {
            'name': name,
            'email': email,
            'password_hash': password_hash,
            'created_at': datetime.utcnow(),
            'is_premium': False,
            'daily_limit': 5,  # Free users get 5 summaries per day
            'summaries_count_today': 0,
            'last_summary_reset': datetime.utcnow()
        }
        result = self.collection.insert_one(user_data)
        return str(result.inserted_id)
    
    def find_by_email(self, email):
        user_doc = self.collection.find_one({'email': email})
        if user_doc:
            user_doc['_id'] = str(user_doc['_id'])
            return user_doc
        return None
    
    def find_by_id(self, user_id):
        if not ObjectId.is_valid(user_id):
            return None
        user_doc = self.collection.find_one({'_id': ObjectId(user_id)})
        if user_doc:
            user_doc['_id'] = str(user_doc['_id'])
            return user_doc
        return None
    
    def increment_summary_count(self, user_id):
        """Increment the user's summary count for today using atomic operation"""
        try:
            from datetime import datetime
            now = datetime.utcnow()
            
            # Use atomic findAndModify for race condition safety
            result = self.collection.find_one_and_update(
                {'_id': ObjectId(user_id)},
                [
                    {
                        '$set': {
                            'summaries_count_today': {
                                '$cond': [
                                    {
                                        '$gte': [
                                            {'$toDate': '$last_summary_reset'},
                                            {'$dateTrunc': {'date': '$$NOW', 'unit': 'day'}}
                                        ]
                                    },
                                    {'$add': ['$summaries_count_today', 1]},
                                    1
                                ]
                            },
                            'last_summary_reset': '$$NOW'
                        }
                    }
                ],
                returnDocument=True
            )
            
            logger.info(f"User {user_id} summary count incremented")
            return result is not None
        except Exception as e:
            logger.error(f"Error incrementing summary count for user {user_id}: {str(e)}")
            # Fallback to simple increment
            try:
                self.collection.update_one(
                    {'_id': ObjectId(user_id)},
                    {'$inc': {'summaries_count_today': 1}}
                )
                return True
            except Exception as fallback_error:
                logger.error(f"Fallback increment failed: {str(fallback_error)}")
                return False
    
    def can_create_summary(self, user_id):
        """Check if user can create another summary today"""
        user_doc = self.find_by_id(user_id)
        if not user_doc:
            return False
        
        # Premium users have unlimited summaries
        if user_doc.get('is_premium', False):
            return True
        
        # Free users are limited to daily_limit summaries per day
        summaries_count = user_doc.get('summaries_count_today', 0)
        daily_limit = user_doc.get('daily_limit', 5)
        
        # Check if we need to reset the counter (new day)
        last_reset = user_doc.get('last_summary_reset', datetime.utcnow())
        if (datetime.utcnow() - last_reset).days >= 1:
            # Counter should be reset, so user can create summary
            return True
        
        return summaries_count < daily_limit