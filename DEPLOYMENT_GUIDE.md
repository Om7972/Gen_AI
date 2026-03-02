# Deployment Guide for PDF & YouTube Summarizer SaaS

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Database Setup](#database-setup)
6. [Production Deployment Options](#production-deployment-options)

## Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- MongoDB (local or cloud instance)
- FFmpeg (for video processing)
- Git

## Environment Setup

### Backend (.env)
```bash
SECRET_KEY=your-super-secret-key-change-this-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-this-in-production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/pdf_summarizer?retryWrites=true&w=majority
FLASK_ENV=production
MAX_FILE_SIZE=10485760
```

### Frontend (.env)
```bash
REACT_APP_API_URL=https://your-backend-domain.com/api
```

## Backend Deployment

### 1. Clone the Repository
```bash
git clone <repository-url>
cd video-pdf-summarization/server
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Install FFmpeg
#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install ffmpeg
```

#### macOS:
```bash
brew install ffmpeg
```

#### Windows:
Download from [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html) and add to PATH

### 4. Run the Server
```bash
python server.py
```

## Frontend Deployment

### 1. Navigate to Client Directory
```bash
cd video-pdf-summarization/client
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build for Production
```bash
npm run build
```

### 4. Serve with a Static Server
```bash
npx serve -s build
```

## Database Setup

### MongoDB Atlas (Recommended for Production)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas/database)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Whitelist your IP address (or allow access from anywhere for production)
5. Get your connection string and update your `.env` file

### Local MongoDB (Development)

1. Install MongoDB Community Edition
2. Start MongoDB service
3. Update your `.env` file:
```
MONGO_URI=mongodb://localhost:27017/pdf_summarizer
```

## Production Deployment Options

### Option 1: Railway

1. Create a Railway account
2. Connect your GitHub repository
3. Add the following variables in Railway settings:
   - SECRET_KEY
   - JWT_SECRET_KEY
   - MONGO_URI
   - FLASK_ENV
   - MAX_FILE_SIZE
4. Deploy both frontend and backend as separate services

### Option 2: Render

#### Backend:
1. Create a new Web Service
2. Repository: Your GitHub repo
3. Root Directory: `/server`
4. Runtime: Python
5. Environment variables:
   - SECRET_KEY
   - JWT_SECRET_KEY
   - MONGO_URI
   - FLASK_ENV
   - MAX_FILE_SIZE

#### Frontend:
1. Create a new Static Site
2. Repository: Your GitHub repo
3. Root Directory: `/client`
4. Build Command: `npm install && npm run build`
5. Publish Directory: `build`

### Option 3: AWS/GCP/Azure

Deploy as containerized applications using Docker:

#### Backend Dockerfile:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY server/requirements.txt .
RUN pip install -r requirements.txt

RUN apt-get update && apt-get install -y ffmpeg

COPY server/ .

CMD ["python", "server.py"]
```

#### Frontend Dockerfile:
```dockerfile
FROM node:16-alpine as build

WORKDIR /app
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Security Best Practices

1. **Never commit secrets to version control**
2. **Use HTTPS in production**
3. **Validate and sanitize all inputs**
4. **Implement rate limiting**
5. **Regular security audits**
6. **Keep dependencies updated**

## Scaling Recommendations

1. **Database**: Use MongoDB Atlas clusters for horizontal scaling
2. **Backend**: Implement Redis for caching and session management
3. **Storage**: Use cloud storage (AWS S3, Google Cloud Storage) for file uploads
4. **CDN**: Use a CDN for serving static assets
5. **Load Balancer**: Distribute traffic across multiple instances

## Monitoring and Logging

1. **Application Logs**: Monitor server logs for errors
2. **Performance**: Track API response times
3. **Database**: Monitor database connections and performance
4. **Security**: Log authentication attempts and suspicious activities

## Troubleshooting

### Common Issues:

1. **FFmpeg not found**: Ensure FFmpeg is installed and in system PATH
2. **Database connection issues**: Check MongoDB URI and network access
3. **Model loading errors**: Ensure sufficient memory and disk space
4. **CORS errors**: Verify frontend domain is allowed in backend config

### Performance Tuning:

1. **Model caching**: Keep transformer models in memory after first load
2. **File cleanup**: Regularly clean up temporary files
3. **Connection pooling**: Use database connection pooling
4. **Asynchronous processing**: Consider Celery for long-running tasks