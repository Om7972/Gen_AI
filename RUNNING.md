# Running the Project

## Fixed Issues

### 1. **Backend Fixes (server/server.py)**
   - ✅ Fixed PDF document close bug - PDF document was being closed before extracting images for OCR
   - ✅ Added chunking support for PDF summarization (same as video endpoint) to handle large PDFs
   - ✅ Improved YouTube video ID extraction to handle various URL formats (youtube.com, youtu.be, etc.)
   - ✅ Optimized summarization function to load model once instead of on every call
   - ✅ Added proper error handling for PDF upload endpoint
   - ✅ Added explicit port configuration (5000) for Flask server

### 2. **Frontend Fixes (client/src/App.jsx)**
   - ✅ Fixed PDF summary response handling to work with new chunked summary format
   - ✅ Added better error handling and user feedback
   - ✅ Improved error messages for both PDF and video endpoints

### 3. **Dependencies**
   - ✅ Updated requirements.txt with compatible versions for Python 3.13
   - ✅ Updated Flask to 3.0.0
   - ✅ Updated Pillow to >=10.0.0 (compatible with Python 3.13)
   - ✅ Updated PyMuPDF, yt-dlp, and other packages to latest compatible versions
   - ✅ Installed all Python dependencies
   - ✅ Installed all Node.js dependencies

## How to Run

### Backend Server

1. **Navigate to the server directory:**
   ```bash
   cd video-pdf-summarization/server
   ```

2. **Run the Flask server:**
   ```bash
   python server.py
   ```
   
   The server will start on `http://127.0.0.1:5000`

   **Note:** The first time you run the server, it will download the summarization model from HuggingFace, which may take a few minutes.

### Frontend Client

1. **Navigate to the client directory:**
   ```bash
   cd video-pdf-summarization/client
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The frontend will typically start on `http://localhost:5173` (Vite default port)

3. **Open your browser and navigate to the URL shown in the terminal**

## Optional Dependencies

### For Video Transcription (Fallback)
If YouTube transcript API fails, the server can download and transcribe videos using Whisper. This requires:
- **ffmpeg**: Install from https://ffmpeg.org/download.html
- The server will automatically use CPU or GPU (if available) for transcription

### For PDF OCR (Scanned PDFs)
If a PDF doesn't have selectable text, the server can use OCR. This requires:
- **Tesseract OCR**: Install from https://github.com/UB-Mannheim/tesseract/wiki
- The server will automatically use OCR when needed

## Usage

1. **Summarize a YouTube Video:**
   - Enter a YouTube video URL in the input field
   - Click "Generate" button
   - Wait for the summary to be generated

2. **Summarize a PDF:**
   - Upload a PDF file using the file input
   - Click "Generate" button
   - Wait for the summary to be generated

## Troubleshooting

### Server won't start
- Make sure all Python dependencies are installed: `pip install -r requirements.txt`
- Check if port 5000 is already in use
- Make sure you're in the correct directory

### Frontend won't start
- Make sure all Node.js dependencies are installed: `npm install`
- Check if the default port (5173) is already in use
- Make sure you're in the client directory

### Model download issues
- The first run will download the summarization model (~1.5GB)
- Make sure you have a stable internet connection
- The model will be cached after first download

### PDF OCR not working
- Install Tesseract OCR if you need OCR functionality
- OCR is only used for scanned PDFs without selectable text

### Video transcription not working
- Most videos have transcripts available via YouTube API
- If transcript is unavailable, install ffmpeg for fallback transcription
- Transcription fallback may take longer and requires more resources

## Notes

- The server uses CPU by default (GPU support available if CUDA is installed)
- Large PDFs or videos may take several minutes to process
- The summarization model is loaded once and reused for better performance
- PDFs are chunked for processing, so large documents are supported

