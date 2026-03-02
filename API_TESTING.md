# API Testing Guide for PDF & YouTube Summarizer SaaS

## Authentication API Tests

### 1. Register a New User
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

Expected Response:
```
201 Created
{
  "message": "User registered successfully!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id_here",
    "name": "John Doe",
    "email": "john.doe@example.com"
  }
}
```

### 2. Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

Expected Response:
```
200 OK
{
  "message": "Login successful!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id_here",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "is_premium": false
  }
}
```

### 3. Get User Profile
```
GET /api/auth/profile
Authorization: Bearer your_jwt_token_here
```

Expected Response:
```
200 OK
{
  "user": {
    "id": "user_id_here",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "is_premium": false,
    "daily_limit": 5,
    "summaries_count_today": 2,
    "created_at": "2023-10-15T10:30:00.000Z"
  }
}
```

## Summarization API Tests

### 1. Summarize YouTube Video
```
POST /api/summarize/youtube
Authorization: Bearer your_jwt_token_here
Content-Type: application/json

{
  "video_link": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

Expected Response:
```
200 OK
{
  "message": "Summary generated successfully!",
  "summary": "This is a concise summary of the YouTube video content...",
  "summary_id": "summary_id_here",
  "word_count": 150,
  "reading_time": 1
}
```

### 2. Summarize PDF Document
```
POST /api/summarize/pdf
Authorization: Bearer your_jwt_token_here
Content-Type: multipart/form-data

file: your_document.pdf
```

Expected Response:
```
200 OK
{
  "message": "Summary generated successfully!",
  "summary": "This is a concise summary of the PDF document content...",
  "summary_id": "summary_id_here",
  "word_count": 250,
  "reading_time": 2
}
```

### 3. Get Summary History
```
GET /api/summarize/history
Authorization: Bearer your_jwt_token_here
```

Or filter by type:
```
GET /api/summarize/history?type=youtube
Authorization: Bearer your_jwt_token_here
```

Expected Response:
```
200 OK
{
  "message": "History retrieved successfully!",
  "summaries": [
    {
      "_id": "summary_id_1",
      "user_id": "user_id_here",
      "type": "youtube",
      "original_source": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "extracted_text": "Full transcript text...",
      "summary_text": "Concise summary of the video...",
      "created_at": "2023-10-15T10:30:00.000Z",
      "word_count": 150,
      "reading_time": 1
    },
    {
      "_id": "summary_id_2",
      "user_id": "user_id_here",
      "type": "pdf",
      "original_source": "document.pdf",
      "extracted_text": "Full PDF text...",
      "summary_text": "Concise summary of the PDF...",
      "created_at": "2023-10-15T09:15:00.000Z",
      "word_count": 250,
      "reading_time": 2
    }
  ]
}
```

### 4. Delete a Summary
```
DELETE /api/summarize/summary_id_here
Authorization: Bearer your_jwt_token_here
```

Expected Response:
```
200 OK
{
  "message": "Summary deleted successfully!"
}
```

## Error Responses

### Unauthorized Access
```
401 Unauthorized
{
  "message": "Token is missing!" // or "Token is invalid!" or "Token has expired!"
}
```

### Validation Errors
```
400 Bad Request
{
  "message": "YouTube video link is required!"
}
```

### Daily Limit Reached
```
429 Too Many Requests
{
  "message": "Daily summary limit reached. Upgrade to premium for unlimited summaries."
}
```

### Server Error
```
500 Internal Server Error
{
  "message": "Error generating YouTube summary: Detailed error message"
}
```

## Sample cURL Commands

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "SecurePass123"
  }'
```

### Login and Get Token
```bash
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "SecurePass123"
  }' | jq -r '.token')
```

### Summarize YouTube with Token
```bash
curl -X POST http://localhost:5000/api/summarize/youtube \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "video_link": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }'
```

## Postman Collection Structure

### Collection: PDF & YouTube Summarizer API
- Folder: Authentication
  - Request: Register User
  - Request: Login User
  - Request: Get Profile
- Folder: Summarization
  - Request: Summarize YouTube
  - Request: Summarize PDF
  - Request: Get History
  - Request: Delete Summary

Each request should have:
- Proper headers
- Sample request bodies
- Expected response codes
- Tests to validate response structure