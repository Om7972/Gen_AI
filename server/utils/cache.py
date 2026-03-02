"""
Redis caching utility for performance optimization
Provides caching for frequently accessed data and expensive computations
"""

import json
import logging
import hashlib
from functools import wraps
from datetime import timedelta

logger = logging.getLogger(__name__)


class CacheManager:
    """Redis cache manager with fallback to in-memory cache"""
    
    def __init__(self, app=None):
        self.app = app
        self.cache = {}  # In-memory fallback
        self.redis_client = None
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize cache with Flask app configuration"""
        self.app = app
        
        try:
            from config import Config
            
            # Try to initialize Redis
            if Config.CACHE_TYPE == 'redis':
                try:
                    import redis
                    self.redis_client = redis.Redis(
                        host=Config.CACHE_REDIS_HOST,
                        port=Config.CACHE_REDIS_PORT,
                        db=Config.CACHE_REDIS_DB,
                        password=Config.CACHE_REDIS_PASSWORD,
                        decode_responses=True
                    )
                    # Test connection
                    self.redis_client.ping()
                    logger.info("Redis cache initialized successfully")
                except Exception as e:
                    logger.warning(f"Redis connection failed, using in-memory cache: {str(e)}")
                    self.redis_client = None
            else:
                logger.info("Using in-memory cache")
                self.redis_client = None
                
        except Exception as e:
            logger.error(f"Cache initialization error: {str(e)}")
            self.redis_client = None
    
    def get(self, key):
        """Get value from cache"""
        try:
            if self.redis_client:
                value = self.redis_client.get(key)
                if value:
                    logger.debug(f"Cache hit for key: {key}")
                    return json.loads(value)
                logger.debug(f"Cache miss for key: {key}")
                return None
            else:
                return self.cache.get(key)
        except Exception as e:
            logger.error(f"Cache get error: {str(e)}")
            return None
    
    def set(self, key, value, timeout=None):
        """Set value in cache with optional timeout (in seconds)"""
        try:
            if timeout is None:
                from config import Config
                timeout = Config.CACHE_DEFAULT_TIMEOUT
            
            serialized = json.dumps(value)
            
            if self.redis_client:
                self.redis_client.setex(key, timeout, serialized)
            else:
                self.cache[key] = serialized
                # Note: In-memory cache doesn't auto-expire
                logger.debug(f"Set in-memory cache for key: {key}")
                
            logger.debug(f"Cached value for key: {key} (timeout: {timeout}s)")
        except Exception as e:
            logger.error(f"Cache set error: {str(e)}")
    
    def delete(self, key):
        """Delete key from cache"""
        try:
            if self.redis_client:
                self.redis_client.delete(key)
            else:
                self.cache.pop(key, None)
            logger.debug(f"Deleted cache key: {key}")
        except Exception as e:
            logger.error(f"Cache delete error: {str(e)}")
    
    def clear_pattern(self, pattern):
        """Clear all keys matching pattern (Redis only)"""
        try:
            if self.redis_client:
                keys = self.redis_client.keys(pattern)
                if keys:
                    self.redis_client.delete(*keys)
                    logger.info(f"Cleared {len(keys)} keys matching pattern: {pattern}")
        except Exception as e:
            logger.error(f"Cache clear pattern error: {str(e)}")
    
    def generate_key(self, *args, **kwargs):
        """Generate cache key from arguments"""
        key_data = f"{':'.join(str(arg) for arg in args)}:{json.dumps(kwargs, sort_keys=True)}"
        return hashlib.md5(key_data.encode()).hexdigest()


# Global cache instance
cache_manager = CacheManager()


def cached(timeout=None, key_prefix='default', ignore_args=False):
    """
    Decorator for caching function results
    
    Args:
        timeout: Cache timeout in seconds
        key_prefix: Prefix for cache key
        ignore_args: If True, use same cache for all arguments
    
    Returns:
        Cached result or function execution result
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Generate cache key
            if ignore_args:
                cache_key = f"{key_prefix}:{f.__name__}"
            else:
                cache_key = f"{key_prefix}:{f.__name__}:{cache_manager.generate_key(*args, **kwargs)}"
            
            # Try to get from cache
            cached_result = cache_manager.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function
            result = f(*args, **kwargs)
            
            # Cache the result
            cache_manager.set(cache_key, result, timeout)
            
            return result
        
        return decorated_function
    return decorator


def invalidate_cache(key_pattern):
    """
    Decorator for invalidating cache after write operations
    
    Args:
        key_pattern: Pattern of keys to invalidate
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Execute function
            result = f(*args, **kwargs)
            
            # Invalidate cache
            cache_manager.clear_pattern(key_pattern)
            
            return result
        
        return decorated_function
    return decorator


# Caching utilities for specific use cases

def cache_youtube_summary(video_id, summary_data, timeout=86400):
    """Cache YouTube summary by video ID (24 hours default)"""
    key = f"youtube:summary:{video_id}"
    cache_manager.set(key, summary_data, timeout)
    logger.info(f"Cached YouTube summary for video: {video_id}")


def get_cached_youtube_summary(video_id):
    """Get cached YouTube summary by video ID"""
    key = f"youtube:summary:{video_id}"
    return cache_manager.get(key)


def cache_pdf_summary(file_hash, summary_data, timeout=604800):
    """Cache PDF summary by file hash (7 days default)"""
    key = f"pdf:summary:{file_hash}"
    cache_manager.set(key, summary_data, timeout)
    logger.info(f"Cached PDF summary for hash: {file_hash}")


def get_cached_pdf_summary(file_hash):
    """Get cached PDF summary by file hash"""
    key = f"pdf:summary:{file_hash}"
    return cache_manager.get(key)


def cache_user_profile(user_id, profile_data, timeout=3600):
    """Cache user profile data (1 hour default)"""
    key = f"user:profile:{user_id}"
    cache_manager.set(key, profile_data, timeout)


def get_cached_user_profile(user_id):
    """Get cached user profile"""
    key = f"user:profile:{user_id}"
    return cache_manager.get(key)


def increment_rate_limit_counter(key, window=3600):
    """
    Increment rate limit counter with expiration
    
    Args:
        key: Rate limit key (e.g., 'rate:user_id:action')
        window: Time window in seconds
    
    Returns:
        Current count
    """
    try:
        if cache_manager.redis_client:
            pipe = cache_manager.redis_client.pipeline()
            pipe.incr(key)
            pipe.expire(key, window)
            results = pipe.execute()
            current_count = results[0]
            logger.debug(f"Rate limit counter for {key}: {current_count}")
            return current_count
        else:
            # In-memory fallback (not persistent across restarts)
            current_count = cache_manager.cache.get(key, 0) + 1
            cache_manager.cache[key] = current_count
            return current_count
    except Exception as e:
        logger.error(f"Rate limit counter error: {str(e)}")
        return 0
