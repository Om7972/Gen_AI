from datetime import datetime
from bson import ObjectId


class Summary:
    def __init__(self, db):
        self.collection = db.summaries
    
    def create_summary(self, user_id, summary_type, original_source, extracted_text, summary_text):
        summary_data = {
            'user_id': user_id,
            'type': summary_type,  # 'youtube' or 'pdf'
            'original_source': original_source,
            'extracted_text': extracted_text,
            'summary_text': summary_text,
            'created_at': datetime.utcnow(),
            'word_count': len(summary_text.split()) if summary_text else 0,
            'reading_time': round(len(summary_text.split()) / 200) if summary_text else 0  # ~200 wpm
        }
        result = self.collection.insert_one(summary_data)
        return str(result.inserted_id)
    
    def get_user_summaries(self, user_id, summary_type=None):
        query = {'user_id': user_id}
        if summary_type:
            query['type'] = summary_type
        summaries = list(self.collection.find(query).sort('created_at', -1))
        for summary in summaries:
            summary['_id'] = str(summary['_id'])
            summary['user_id'] = str(summary['user_id'])
        return summaries
    
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