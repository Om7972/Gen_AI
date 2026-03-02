# Installing FFmpeg on Windows

FFmpeg is only needed if you want to summarize videos that don't have captions available. Most YouTube videos have captions, so FFmpeg is optional.

## Quick Installation (Recommended)

### Option 1: Using Chocolatey (Easiest)

1. **Install Chocolatey** (if not already installed):
   - Open PowerShell as Administrator
   - Run: `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`

2. **Install FFmpeg**:
   ```powershell
   choco install ffmpeg
   ```

3. **Verify installation**:
   ```powershell
   ffmpeg -version
   ```

### Option 2: Manual Installation

1. **Download FFmpeg**:
   - Go to https://www.gyan.dev/ffmpeg/builds/
   - Download the "ffmpeg-release-essentials.zip" file

2. **Extract the files**:
   - Extract the zip file to a folder (e.g., `C:\ffmpeg`)

3. **Add to PATH**:
   - Open System Properties → Environment Variables
   - Under "System Variables", find "Path" and click "Edit"
   - Click "New" and add the path to the `bin` folder (e.g., `C:\ffmpeg\bin`)
   - Click "OK" on all dialogs

4. **Verify installation**:
   - Open a new PowerShell/Command Prompt
   - Run: `ffmpeg -version`

### Option 3: Using winget (Windows 10/11)

```powershell
winget install ffmpeg
```

## After Installation

1. **Restart your terminal/server** - Close and reopen your terminal or restart the Flask server

2. **Test FFmpeg**:
   ```powershell
   ffmpeg -version
   ```

3. **Try your video again** - The fallback transcription should now work

## Note

- FFmpeg is only needed for videos without captions
- Most YouTube videos have captions available
- If you only use videos with captions, you don't need FFmpeg

## Troubleshooting

- **"ffmpeg is not recognized"**: Make sure you added FFmpeg to your PATH and restarted your terminal
- **Still not working**: Try restarting your computer after installation
- **Permission errors**: Make sure you're running PowerShell as Administrator when installing

