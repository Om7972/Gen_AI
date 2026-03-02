# Testing PDF Upload

## To Restart the Server:

1. Stop the current server (Ctrl+C in the terminal where it's running)
2. Navigate to the server directory:
   ```bash
   cd video-pdf-summarization/server
   ```
3. Restart the server:
   ```bash
   python server.py
   ```

## Common Issues and Solutions:

### 1. **No Text Extracted**
- The PDF might be empty or contain only images
- Check if the PDF has selectable text
- OCR support requires Tesseract to be installed

### 2. **Model Loading Issues**
- First time: The model downloads (~1.5GB) - this takes time
- Check server console for "Loading summarization model..." message
- Ensure you have internet connection for first download

### 3. **Empty Summary**
- The PDF text might be too short
- Check server console logs for error messages
- Try with a longer PDF document

### 4. **Server Errors**
- Check the server console for detailed error messages
- Look for Python traceback errors
- Ensure all dependencies are installed

## Debugging Steps:

1. **Check Server Console**: Look for error messages when uploading
2. **Check Browser Console**: Open DevTools (F12) and check for errors
3. **Check Network Tab**: Verify the request is being sent and response received
4. **Try a Simple PDF**: Test with a PDF that definitely has text

## Expected Server Output:

When uploading a PDF, you should see:
```
Extracting text from PDF: uploads/yourfile.pdf
Extracted text length: XXXX characters
Split into X chunks for summarization
Summarizing chunk 1/X...
Summarizing chunk 2/X...
...
Generated summary length: XXXX characters
```

