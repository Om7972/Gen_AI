# How to Start the Server

## Quick Start

1. **Open a new terminal/PowerShell window**

2. **Navigate to the server directory:**
   ```bash
   cd video-pdf-summarization\server
   ```

3. **Start the Flask server:**
   ```bash
   python server.py
   ```

4. **You should see:**
   ```
   * Running on http://127.0.0.1:5000
   * Debug mode: on
   ```

5. **Keep this terminal open** - The server needs to keep running

## Troubleshooting

### If you get "Port 5000 already in use":

1. **Find the process using port 5000:**
   ```powershell
   netstat -ano | findstr ":5000"
   ```

2. **Kill the process:**
   ```powershell
   taskkill /PID <process_id> /F
   ```

3. **Then start the server again**

### If you get "Module not found" errors:

1. **Make sure you're in the correct directory:**
   ```bash
   cd video-pdf-summarization
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

### If the server keeps crashing:

1. **Check the error messages in the terminal**
2. **Make sure all dependencies are installed**
3. **Check if Python is in your PATH**

## Important Notes

- **Keep the server terminal open** - Closing it will stop the server
- The server runs on `http://127.0.0.1:5000`
- The frontend should connect to this address
- If you make changes to `server.py`, the server will auto-reload (debug mode)

