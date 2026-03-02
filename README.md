# PDF & YouTube Video Summarizer SaaS

A production-ready SaaS application that converts lengthy PDF documents and YouTube videos into concise summaries using AI-powered text summarization.

## 🚀 Features

### Core Functionality
- **YouTube Video Summarization**: Extract and summarize video content using YouTube transcripts
- **PDF Document Summarization**: Process PDFs with selectable text or OCR for scanned documents
- **AI-Powered Summarization**: Uses transformer models for high-quality summaries
- **Multi-format Support**: Handles various video and document formats

### SaaS Features
- **JWT-Based Authentication**: Secure user registration and login
- **User Management**: Individual accounts with profile management
- **Summary History**: Persistent storage of all generated summaries
- **Daily Limits**: Free users get 5 summaries/day, premium unlimited
- **Premium Tiers**: Scalable model supporting premium features
- **API Rate Limiting**: Protection against abuse
- **Responsive UI**: Mobile-friendly interface

### Technical Features
- **Modular Architecture**: Clean separation of concerns
- **MongoDB Integration**: Robust data persistence
- **File Upload Validation**: Secure file handling with size limits
- **Error Handling**: Comprehensive error management
- **Logging**: Detailed application logging

## 🛠 Tech Stack

### Backend
- **Python Flask**: REST API framework
- **MongoDB**: Document database for user and summary data
- **PyMongo**: Python driver for MongoDB
- **PyJWT**: JSON Web Token implementation
- **bcrypt**: Password hashing
- **Transformers**: AI model for summarization
- **PyMuPDF**: PDF processing
- **yt-dlp**: YouTube video downloading
- **youtube-transcript-api**: YouTube transcript extraction

### Frontend
- **React**: Component-based UI library
- **React Router**: Client-side routing
- **Axios**: HTTP client with interceptors
- **TailwindCSS**: Utility-first CSS framework
- **React Dropzone**: File upload handling
- **React Toastify**: Notification system

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- MongoDB (local instance or MongoDB Atlas)
- FFmpeg for video processing

## 🔧 Installation

### Backend Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd video-pdf-summarization/server
```

2. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

3. **Install FFmpeg**
   - **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html)
   - **macOS**: `brew install ffmpeg`
   - **Ubuntu**: `sudo apt install ffmpeg`

4. **Set up environment variables**
Create a `.env` file in the server directory:
```env
SECRET_KEY=your-super-secret-key-change-this-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-this-in-production
MONGO_URI=mongodb://localhost:27017/pdf_summarizer
FLASK_ENV=development
MAX_FILE_SIZE=10485760
```

5. **Start the backend server**
```bash
python server.py
```

### Frontend Setup

1. **Navigate to client directory**
```bash
cd video-pdf-summarization/client
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the client directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

4. **Start the development server**
```bash
npm run dev
```

## 🏗 Project Structure

```
video-pdf-summarization/
├── server/                 # Backend Flask application
│   ├── config.py           # Configuration settings
│   ├── server.py           # Main application entry point
│   ├── models/             # Database models
│   │   ├── user_model.py   # User data model
│   │   └── summary_model.py # Summary data model
│   ├── routes/             # API route definitions
│   │   ├── auth_routes.py  # Authentication endpoints
│   │   └── summary_routes.py # Summary endpoints
│   ├── services/           # Business logic services
│   │   ├── youtube_service.py # YouTube processing
│   │   ├── pdf_service.py  # PDF processing
│   │   └── summarizer_service.py # Summarization logic
│   ├── middleware/         # Request processing middleware
│   │   └── jwt_middleware.py # Authentication middleware
│   ├── utils/              # Utility functions
│   │   ├── chunking.py     # Text chunking utilities
│   │   └── text_cleaner.py # Text processing utilities
│   └── requirements.txt    # Python dependencies
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React context providers
│   │   └── services/       # API service clients
└── DEPLOYMENT_GUIDE.md     # Deployment instructions
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (requires auth)

### Summarization
- `POST /api/summarize/youtube` - Summarize YouTube video (requires auth)
- `POST /api/summarize/pdf` - Summarize PDF document (requires auth)
- `GET /api/summarize/history` - Get user summary history (requires auth)
- `DELETE /api/summarize/<id>` - Delete specific summary (requires auth)

## 🚀 Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed deployment instructions to various platforms including Railway, Render, and AWS.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 💬 Support

For support, please open an issue in the repository or contact the development team.

---

Built with ❤️ by the development team