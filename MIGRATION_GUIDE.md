# 🔄 Backend Optimization Migration Guide

## Quick Start - Installation & Setup

### Step 1: Install New Dependencies
```bash
cd video-pdf-summarization
pip install -r requirements.txt
```

**New packages:**
- Flask-Limiter==3.5.0 (Rate limiting)
- marshmallow==3.20.1 (Validation)
- redis==5.0.1 (Caching)

---

### Step 2: Set Up Redis (Optional but Recommended)

#### Windows
```bash
# Download Redis for Windows
https://github.com/microsoftarchive/redis/releases

# Or use WSL
wsl sudo apt-get install redis-server
wsl sudo systemctl start redis
```

#### macOS
```bash
brew install redis
brew services start redis
```

#### Linux
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

#### Test Redis Connection
```python
import redis
r = redis.Redis(host='localhost', port=6379)
r.ping()  # Should return True
```

---

### Step 3: Update Environment Variables

Create or update `.env` file in `server/` directory:

```bash
# Existing variables (keep these)
SECRET_KEY=your-secret-key-here
MONGO_URI=mongodb://localhost:27017/pdf_summarizer
JWT_SECRET_KEY=jwt-secret-string

# NEW: Rate Limiting
RATE_LIMIT_ENABLED=True
RATE_LIMIT_DEFAULT=10 per hour
RATE_LIMIT_STORAGE_URL=redis://localhost:6379/0

# NEW: Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# NEW: Caching
CACHE_TYPE=redis
CACHE_DEFAULT_TIMEOUT=3600

# NEW: Logging
LOG_LEVEL=INFO
LOG_TO_FILE=True
LOG_FILE=summarizer.log
```

---

### Step 4: Run Database Indexes

Connect to MongoDB and run:

```javascript
use pdf_summarizer

// User indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ email: 1, is_premium: 1 })

// Summary indexes
db.summaries.createIndex({ user_id: 1 })
db.summaries.createIndex({ created_at: -1 })
db.summaries.createIndex({ type: 1 })
db.summaries.createIndex({ user_id: 1, type: 1, created_at: -1 })
db.summaries.createIndex({ video_id: 1 })
db.summaries.createIndex({ original_source: "text", extracted_text: "text" })
```

---

### Step 5: Test the Optimized Backend

#### Start the Server
```bash
cd server
python server.py
```

#### Expected Output
```
2026-03-02 14:23:45,123 INFO: Application started at 2026-03-02T14:23:45.123456
2026-03-02 14:23:45,234 INFO: Log level: INFO
2026-03-02 14:23:45,345 INFO: Rate limiting enabled: 10 per hour
2026-03-02 14:23:45,456 INFO: Redis cache initialized successfully
2026-03-02 14:23:45,567 INFO: User collection indexes created successfully
2026-03-02 14:23:45,678 INFO: Summary collection indexes created successfully
```

---

## Testing Checklist

### ✅ Health Check
```bash
curl http://localhost:5000/health
```
Expected response:
```json
{
    "status": "healthy",
    "timestamp": "2026-03-02T14:23:45.123456"
}
```

### ✅ Test Caching
1. Make first YouTube summary request (cache miss, ~5-10s)
2. Make same request again (cache hit, <100ms)
3. Check logs for "Cache hit" message

### ✅ Test Rate Limiting
```bash
# Send 11 rapid requests
for i in {1..11}; do
  curl http://localhost:5000/health
done
```
11th request should return HTTP 429 with:
```json
{
    "success": false,
    "message": "Rate limit exceeded. Please slow down."
}
```

### ✅ Test Validation
```bash
curl -X POST http://localhost:5000/api/summarize/youtube \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"video_link": "invalid-url"}'
```
Should return 400 with validation errors.

### ✅ Test Error Format
Make any invalid request and verify response format:
```json
{
    "success": false,
    "message": "Error message here"
}
```

---

## Troubleshooting

### Redis Connection Failed
**Error**: `Redis connection failed`

**Solutions**:
1. Check if Redis is running: `redis-cli ping`
2. Check Redis port: `netstat -an | grep 6379`
3. Try memory cache instead: Set `CACHE_TYPE=memory` in .env

### Rate Limit Not Working
**Error**: Rate limiting not enforced

**Solutions**:
1. Check `RATE_LIMIT_ENABLED=True` in .env
2. Verify Redis is accessible
3. Check server logs for rate limiter initialization

### Indexes Not Created
**Error**: `Index creation failed`

**Solutions**:
1. Manually run index creation commands in MongoDB shell
2. Check MongoDB connection string
3. Verify MongoDB user has index creation permissions

### Marshmallow Import Error
**Error**: `ModuleNotFoundError: No module named 'marshmallow'`

**Solution**:
```bash
pip install marshmallow==3.20.1
```

### File Size Limit Not Enforced
**Error**: Large files accepted

**Solution**:
Check `MAX_FILE_SIZE = 10 * 1024 * 1024` in summary_routes.py

---

## Performance Tuning

### For High Traffic (>1000 users/day)

Increase rate limits:
```bash
RATE_LIMIT_DEFAULT=100 per hour
```

Increase Redis memory:
```bash
# In redis.conf
maxmemory 512mb
maxmemory-policy allkeys-lru
```

Adjust cache timeouts:
```bash
CACHE_DEFAULT_TIMEOUT=7200  # 2 hours
```

### For Low Memory Servers (<2GB RAM)

Use memory-efficient caching:
```bash
CACHE_TYPE=memory
CACHE_DEFAULT_TIMEOUT=300  # 5 minutes
```

Disable file logging:
```bash
LOG_TO_FILE=False
```

### For Better Response Times

Enable compression:
```python
from flask_compress import Compress
Compress(app)
```

Use connection pooling:
```python
from pymongo import MongoClient
client = MongoClient(MONGO_URI, maxPoolSize=50)
```

---

## Rollback Plan

If you need to rollback to the previous version:

### 1. Keep Backup of Old Files
```bash
cp -r server server_backup_$(date +%Y%m%d)
```

### 2. Revert requirements.txt
Remove these lines:
```txt
Flask-Limiter==3.5.0
marshmallow==3.20.1
redis==5.0.1
```

### 3. Restore Old Code
```bash
rm -rf server
mv server_backup_20260302 server
```

### 4. Restart Server
```bash
cd server
python server.py
```

---

## Monitoring After Deployment

### Check Logs Regularly
```bash
tail -f summarizer.log
```

### Monitor Cache Performance
```bash
grep "Cache hit" summarizer.log | wc -l
grep "Cache miss" summarizer.log | wc -l
```

### Track Response Times
```bash
grep "Duration:" summarizer.log | awk '{print $NF}' | sort -n | tail -10
```

### Watch for Errors
```bash
grep "ERROR" summarizer.log | tail -20
```

---

## Next Steps After Migration

1. **Monitor for 24-48 hours**: Watch for unexpected errors
2. **Check cache hit rates**: Should be >50% for popular content
3. **Review rate limit settings**: Adjust based on usage patterns
4. **Set up log rotation**: Prevent disk space issues
5. **Configure backup strategy**: Regular MongoDB backups
6. **Set up monitoring alerts**: For errors and performance issues

---

## Support

If you encounter issues:

1. Check logs: `summarizer.log`
2. Verify environment variables in `.env`
3. Test Redis connection: `redis-cli ping`
4. Check MongoDB status: `mongo --eval "db.version()"`
5. Review this guide's troubleshooting section

---

**Migration Time**: ~30 minutes  
**Difficulty**: Intermediate  
**Backward Compatibility**: 100% API compatible  
**Production Ready**: Yes
