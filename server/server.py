import os
os.environ["KMP_DUPLICATE_LIB_OK"]="TRUE"
import sys
import json
import re
import time
import shutil
import subprocess
import torch
import numpy as np
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

from transformers import pipeline
from youtube_transcript_api import YouTubeTranscriptApi
from werkzeug.utils import secure_filename
import fitz  # PyMuPDF
import pytesseract
from pytesseract import TesseractNotFoundError
from PIL import Image
import io


app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = r'uploads'
CORS(app)

whisper_models = ["small", "medium", "small.en", "medium.en"]
source_languages = {
    "en": "English",
    "zh": "Chinese",
    "de": "German",
    "es": "Spanish",
    "ru": "Russian",
    "ko": "Korean",
    "fr": "French"
}
source_language_list = [key[0] for key in source_languages.items()]

# Resolve FFmpeg executable path in a robust way
def resolve_ffmpeg_path():
    """Return a usable FFmpeg executable path.

    Priority:
    1. Environment variable `FFMPEG_PATH` (file path or directory containing ffmpeg(.exe))
    2. Local repo path: server/ffmpeg/bin/ffmpeg(.exe)
    3. System PATH (by using command name 'ffmpeg')
    """
    # 1) Env var
    env_path = os.environ.get('FFMPEG_PATH')
    if env_path:
        # If a directory is provided, append executable name
        candidate = env_path
        if os.path.isdir(candidate):
            exe_name = 'ffmpeg.exe' if os.name == 'nt' else 'ffmpeg'
            candidate = os.path.join(candidate, exe_name)
        if os.path.isfile(candidate):
            return candidate

    # 2) Local repo path (server/ffmpeg/bin/ffmpeg(.exe))
    current_directory = os.path.dirname(os.path.realpath(__file__))
    local_candidate = os.path.join(current_directory, 'ffmpeg', 'bin', 'ffmpeg.exe' if os.name == 'nt' else 'ffmpeg')
    if os.path.isfile(local_candidate):
        return local_candidate

    # 3) Fallback to command name; relies on PATH
    return 'ffmpeg'

# Download video .m4a and info.json
def get_youtube(video_url):
    import yt_dlp
    
    # Create a temporary directory for downloads to avoid file locking issues
    temp_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'temp_downloads')
    os.makedirs(temp_dir, exist_ok=True)
    
    # Configure yt-dlp with better options for Windows
    ydl_opts = {
        'format': 'bestaudio[ext=m4a]',
        'outtmpl': os.path.join(temp_dir, '%(title)s.%(ext)s'),
        'noplaylist': True,
        'quiet': False,
        'no_warnings': False,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=True)
            info['title'] = info['title'].replace('$', '').replace('|', '-').replace('/', '-').replace('\\', '-')
            
            # Find the downloaded file
            video_id = info.get('id', '')
            title = info['title']
            
            # Try to find the downloaded file
            downloaded_file = None
            for file in os.listdir(temp_dir):
                if file.endswith('.m4a') and (video_id in file or title[:50] in file):
                    downloaded_file = os.path.join(temp_dir, file)
                    break
            
            if not downloaded_file:
                # Fallback: find any .m4a file in temp_dir
                m4a_files = [f for f in os.listdir(temp_dir) if f.endswith('.m4a')]
                if m4a_files:
                    # Get the most recently modified file
                    m4a_files.sort(key=lambda x: os.path.getmtime(os.path.join(temp_dir, x)), reverse=True)
                    downloaded_file = os.path.join(temp_dir, m4a_files[0])
            
            if not downloaded_file or not os.path.exists(downloaded_file):
                raise FileNotFoundError("Downloaded file not found")
            
            # Wait a bit to ensure file is fully written
            time.sleep(0.5)
            
            # Rename to a clean filename
            clean_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).strip()[:100]
            final_filename = f"{clean_title}_{video_id}.m4a"
            final_path = os.path.join(temp_dir, final_filename)
            
            # Retry renaming if file is locked
            max_retries = 5
            for attempt in range(max_retries):
                try:
                    if os.path.exists(final_path) and final_path != downloaded_file:
                        os.remove(final_path)
                    if downloaded_file != final_path:
                        shutil.move(downloaded_file, final_path)
                    break
                except (OSError, PermissionError) as e:
                    if attempt < max_retries - 1:
                        time.sleep(0.5 * (attempt + 1))
                    else:
                        # If rename fails, use the original downloaded file
                        final_path = downloaded_file
                        print(f"Warning: Could not rename file, using original: {downloaded_file}")
            
            # Save info.json
            info_json_path = final_path.replace('.m4a', '.info.json')
            with open(info_json_path, 'w', encoding='utf-8') as outfile:
                json.dump(info, outfile, indent=2, ensure_ascii=False)

        print(f"Successfully downloaded {video_url} to {final_path}")
        return final_path
        
    except Exception as e:
        print(f"Error downloading video: {e}")
        raise

# Convert video .m4a into .wav
def convert_to_wav(video_file_path, offset=0):
    # Ensure the file exists
    if not os.path.exists(video_file_path):
        raise FileNotFoundError(f"Video file not found: {video_file_path}")
    
    out_path = video_file_path.replace(".m4a", ".wav")
    if os.path.exists(out_path):
        print("wav file already exists:", out_path)
        return out_path

    try:
        print("starting conversion to wav")
        # Wait a bit to ensure the file is fully written and not locked
        time.sleep(0.5)
        
        # Use subprocess instead of os.system for better error handling
        ffmpeg_path = resolve_ffmpeg_path()
        cmd = [ffmpeg_path, '-y']  # -y to overwrite output file
        if offset > 0:
            cmd.extend(['-ss', str(offset)])
        cmd.extend(['-i', video_file_path, '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', out_path])
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        if result.returncode != 0:
            print(f"FFmpeg error: {result.stderr}")
            raise RuntimeError(f"FFmpeg conversion failed: {result.stderr}")
        
        # Wait a bit to ensure file is fully written
        time.sleep(0.5)
        
        if not os.path.exists(out_path):
            raise RuntimeError("WAV file was not created")
            
        print("conversion to wav ready:", out_path)
    except subprocess.TimeoutExpired:
        raise RuntimeError("FFmpeg conversion timed out")
    except FileNotFoundError:
        raise RuntimeError("FFmpeg not found. Please install FFmpeg or set FFMPEG_PATH to use video transcription fallback.")
    except Exception as e:
        raise RuntimeError(f"Error converting to WAV: {str(e)}")

    return out_path

# Transcribe .wav into .segments.json
def speech_to_text(video_file_path, selected_source_lang='en', whisper_model='small.en', vad_filter=False):
    print('loading faster_whisper model:', whisper_model)
    from faster_whisper import WhisperModel
    # Use CUDA if available, otherwise fall back to CPU so server can run on machines without GPU
    fw_device = "cuda" if torch.cuda.is_available() else "cpu"
    model = WhisperModel(whisper_model, device=fw_device)
    if (video_file_path == None):
        raise ValueError("Error no video input")
    print(video_file_path)

    try:
        # Read and convert youtube video
        # video_file_path should already be the .m4a file
        if not video_file_path.endswith('.m4a'):
            audio_file = video_file_path.replace(os.path.splitext(video_file_path)[1], ".m4a")
        else:
            audio_file = video_file_path
        
        if not os.path.exists(audio_file):
            raise FileNotFoundError(f"Audio file not found: {audio_file}")
        
        out_file = audio_file.replace(".m4a", ".segments.json")
        if os.path.exists(out_file):
            print("segments file already exists:", out_file)
            with open(out_file) as f:
                segments = json.load(f)
            return segments

        # Transcribe audio
        print('starting transcription...')
        options = dict(language=selected_source_lang, beam_size=5, best_of=5, vad_filter=vad_filter)
        transcribe_options = dict(task="transcribe", **options)

        segments_raw, info = model.transcribe(audio_file, **transcribe_options)

        # Convert back to original openai format
        segments = []
        i = 0
        for segment_chunk in segments_raw:
            chunk = {}
            chunk["start"] = segment_chunk.start
            chunk["end"] = segment_chunk.end
            chunk["text"] = segment_chunk.text
            print(chunk)
            segments.append(chunk)
            i += 1
        print("transcribe audio done with fast whisper")

        with open(out_file, 'w') as f:
            f.write(json.dumps(segments, indent=2))

    except Exception as e:
        raise RuntimeError("Error transcribing.")
    return segments


def extract_video_id(video_link):
    # Extract video ID from various YouTube URL formats
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)',
        r'youtube\.com\/watch\?.*v=([^&\n?#]+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, video_link)
        if match:
            return match.group(1)
    # Fallback: try splitting by '=' and take the last part
    if '=' in video_link:
        return video_link.split('=')[-1].split('&')[0].split('?')[0]
    # If no match, return the last part of the URL
    return video_link.split('/')[-1].split('?')[0].split('&')[0]

ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# Global summarizer / OCR helpers
_summarizer = None
_model_loading = False
_easyocr_reader = None

def summarize(large_text):
    global _summarizer, _model_loading
    if _summarizer is None and not _model_loading:
        _model_loading = True
        try:
            hf_name = 'pszemraj/led-large-book-summary'
            print("Loading summarization model... This may take a few minutes on first use.")
            _summarizer = pipeline(
                "summarization",
                hf_name,
                device=0 if torch.cuda.is_available() else -1,
            )
            print("Summarization model loaded successfully!")
        except Exception as e:
            print(f"Error loading summarization model: {e}")
            _model_loading = False
            raise RuntimeError(f"Failed to load summarization model: {str(e)}")
        finally:
            _model_loading = False
    elif _model_loading:
        # Wait for model to finish loading
        import time
        max_wait = 300  # 5 minutes max wait
        waited = 0
        while _model_loading and waited < max_wait:
            time.sleep(1)
            waited += 1
        if _summarizer is None:
            raise RuntimeError("Model loading timed out or failed")

    wall_of_text = large_text

    result = _summarizer(
        wall_of_text,
        min_length=16,
        max_length=256,
        no_repeat_ngram_size=3,
        encoder_no_repeat_ngram_size=3,
        repetition_penalty=3.5,
        num_beams=4,
        early_stopping=True,
    )

    return result

# Function to split text into chunks but keep same lines in 2 parts at the end and start
def split_keep_context(text):
    lines = text.split('\n')
    chunk_size = 16384
    chunk_texts = []
    current_chunk = ""
    for line in lines:
        if len(current_chunk) + len(line) < chunk_size:
            current_chunk += line + '\n'
        else:
            chunk_texts.append(current_chunk)
            current_chunk = line + '\n'
    if current_chunk:
        chunk_texts.append(current_chunk)
    return chunk_texts

def read_subtitle_json(file_path):
    try:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Transcript file not found: {file_path}")
        with open(file_path, 'r', encoding='utf-8') as file:
            subtitles = json.load(file)
            return subtitles
    except FileNotFoundError as e:
        print(f"File not found: {e}")
        raise
    except json.JSONDecodeError as e:
        print(f"Invalid JSON format: {e}")
        raise ValueError(f"Invalid JSON format in transcript file: {e}")

def merge_subtitles_to_paragraph(subtitles):
    paragraph = ""
    for subtitle in subtitles:
        paragraph += subtitle['text'] + ' '
    return paragraph.strip()

def get_easyocr_reader():
    """Lazy-load EasyOCR reader to avoid repeated heavy initialisation."""
    global _easyocr_reader
    if _easyocr_reader is None:
        import easyocr
        print("Loading EasyOCR reader for OCR fallback...")
        _easyocr_reader = easyocr.Reader(['en'], gpu=torch.cuda.is_available())
        print("EasyOCR reader ready.")
    return _easyocr_reader

def parse_subtitle_file(subtitle_file):
    """Parse VTT, SRT, or TTML subtitle files and convert to transcript format"""
    import re
    from datetime import timedelta
    
    transcript = []
    
    try:
        with open(subtitle_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Determine file type
        if subtitle_file.endswith('.vtt'):
            # Parse WebVTT format
            # Pattern: timestamp --> timestamp\n text
            pattern = r'(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})\s*\n(.*?)(?=\n\d{2}:\d{2}:\d{2}|$)'
            matches = re.finditer(pattern, content, re.MULTILINE | re.DOTALL)
            
            for match in matches:
                start_str = match.group(1)
                end_str = match.group(2)
                text = match.group(3).strip()
                
                # Remove VTT tags
                text = re.sub(r'<[^>]+>', '', text)
                text = re.sub(r'\n', ' ', text).strip()
                
                if text:
                    # Convert timestamp to seconds
                    start_time = parse_vtt_timestamp(start_str)
                    end_time = parse_vtt_timestamp(end_str)
                    
                    transcript.append({
                        'start': start_time,
                        'end': end_time,
                        'text': text
                    })
        
        elif subtitle_file.endswith('.srt'):
            # Parse SRT format
            # Pattern: number\n timestamp --> timestamp\n text\n
            pattern = r'(\d+)\s*\n(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*\n(.*?)(?=\n\d+\s*\n|$)'
            matches = re.finditer(pattern, content, re.MULTILINE | re.DOTALL)
            
            for match in matches:
                start_str = match.group(2).replace(',', '.')
                end_str = match.group(3).replace(',', '.')
                text = match.group(4).strip()
                
                # Remove SRT tags
                text = re.sub(r'<[^>]+>', '', text)
                text = re.sub(r'\n', ' ', text).strip()
                
                if text:
                    start_time = parse_vtt_timestamp(start_str)
                    end_time = parse_vtt_timestamp(end_str)
                    
                    transcript.append({
                        'start': start_time,
                        'end': end_time,
                        'text': text
                    })
        
        elif subtitle_file.endswith('.ttml'):
            # Parse TTML format (simplified)
            # Extract <p> tags with begin and end times
            pattern = r'<p[^>]*begin="([^"]+)"[^>]*end="([^"]+)"[^>]*>(.*?)</p>'
            matches = re.finditer(pattern, content, re.DOTALL)
            
            for match in matches:
                start_str = match.group(1)
                end_str = match.group(2)
                text = match.group(3).strip()
                
                # Remove TTML tags
                text = re.sub(r'<[^>]+>', '', text)
                text = re.sub(r'\s+', ' ', text).strip()
                
                if text:
                    start_time = parse_ttml_timestamp(start_str)
                    end_time = parse_ttml_timestamp(end_str)
                    
                    transcript.append({
                        'start': start_time,
                        'end': end_time,
                        'text': text
                    })
        
        return transcript if transcript else None
        
    except Exception as e:
        print(f"Error parsing subtitle file {subtitle_file}: {e}")
        import traceback
        print(traceback.format_exc())
        return None

def parse_vtt_timestamp(timestamp_str):
    """Convert VTT/SRT timestamp (HH:MM:SS.mmm) to seconds"""
    try:
        parts = timestamp_str.split(':')
        hours = int(parts[0])
        minutes = int(parts[1])
        seconds_parts = parts[2].split('.')
        seconds = int(seconds_parts[0])
        milliseconds = int(seconds_parts[1]) if len(seconds_parts) > 1 else 0
        return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000.0
    except:
        return 0.0

def parse_ttml_timestamp(timestamp_str):
    """Convert TTML timestamp to seconds"""
    try:
        # TTML format: HH:MM:SS.mmm or HH:MM:SS
        if '.' in timestamp_str:
            return parse_vtt_timestamp(timestamp_str)
        else:
            parts = timestamp_str.split(':')
            hours = int(parts[0])
            minutes = int(parts[1])
            seconds = int(parts[2])
            return hours * 3600 + minutes * 60 + seconds
    except:
        return 0.0

def save_transcript_to_json(transcript, output_file):
    try:
        # Get the directory of the current script file
        current_directory = os.path.dirname(os.path.realpath(__file__))
        output_path = os.path.join(current_directory, output_file) if not os.path.isabs(output_file) else output_file
        
        # Write transcript to a JSON file
        with open(output_path, 'w', encoding='utf-8') as file:
            json.dump(transcript, file, indent=2, ensure_ascii=False)
        return output_path
    except Exception as e:
        print(f"Error saving transcript to JSON: {str(e)}")
        raise

def extract_text_from_pdf(pdf_path):
    """Extract selectable text and/or OCR text from PDF."""
    selectable_text = ""
    ocr_text = ""

    pdf_document = fitz.open(pdf_path)

    try:
        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            page_text = page.get_text()
            page_text = "\n".join([line.strip() for line in page_text.splitlines() if line.strip()])
            selectable_text += page_text + "\n"

        if selectable_text.strip():
            print("Selectable text found in PDF, skipping OCR.")
        else:
            print("No selectable text found. Running OCR fallback...")
            ocr_text = run_ocr_on_pdf(pdf_document)

    finally:
        if not pdf_document.is_closed:
            pdf_document.close()

    combined_text = (selectable_text + "\n" + ocr_text).strip()
    return combined_text

def run_ocr_on_pdf(pdf_document):
    """Render each PDF page and run OCR using pytesseract/easyocr."""
    ocr_text = ""
    easyocr_reader = None

    for page_num in range(len(pdf_document)):
        page = pdf_document.load_page(page_num)
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # upscale for better OCR
        image_bytes = pix.tobytes("png")
        image = Image.open(io.BytesIO(image_bytes))

        page_text = ""
        try:
            page_text = pytesseract.image_to_string(image)
        except TesseractNotFoundError:
            print("Tesseract not installed. Falling back to EasyOCR.")
        except Exception as e:
            print(f"pytesseract OCR error on page {page_num + 1}: {e}")

        if not page_text or not page_text.strip():
            try:
                if easyocr_reader is None:
                    easyocr_reader = get_easyocr_reader()
                ocr_result = easyocr_reader.readtext(np.array(image), detail=0, paragraph=True)
                page_text = " ".join(ocr_result)
            except Exception as e:
                print(f"EasyOCR error on page {page_num + 1}: {e}")
                page_text = ""

        page_text = "\n".join([line.strip() for line in page_text.splitlines() if line.strip()])

        if page_text:
            ocr_text += f"\n\n[Page {page_num + 1} OCR]\n{page_text}"

    if not ocr_text.strip():
        print("OCR fallback did not extract any text.")
    else:
        print("OCR fallback extracted text successfully.")

    return ocr_text.strip()

@app.route('/generate-summary', methods=['POST'])
def generate_summary():
    # Get video link from POST request
    video_link = request.json.get('video_link')

    if not video_link:
        return jsonify({'error': 'Video link not provided'}), 400

    # Extract video ID from the link
    video_id = extract_video_id(video_link)

    transcript = None
    transcript_source = None
    
    # Method 1: Try YouTube Transcript API
    try:
        # First, try to get list of available transcripts
        try:
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            print(f"Available transcripts for video {video_id}:")
            for transcript_info in transcript_list:
                print(f"  - {transcript_info.language} ({transcript_info.language_code})")
        except Exception as e:
            print(f"Could not list transcripts: {e}")
        
        # Try English first, then any available
        try:
            transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=['en'])
            transcript_source = "YouTube Transcript API (English)"
            print("Successfully fetched English transcript via YouTube Transcript API")
        except Exception as e:
            print(f"English transcript not available: {e}")
            try:
                # Try to get any available transcript
                transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
                for transcript_info in transcript_list:
                    try:
                        transcript = transcript_info.fetch()
                        transcript_source = f"YouTube Transcript API ({transcript_info.language})"
                        print(f"Successfully fetched {transcript_info.language} transcript via YouTube Transcript API")
                        break
                    except:
                        continue
            except Exception as e2:
                print(f"Could not fetch any transcript via YouTube Transcript API: {e2}")
    except Exception as e:
        print(f"YouTube Transcript API failed: {e}")
    
    # Method 2: Try yt-dlp to extract transcript directly
    if not transcript:
        try:
            import yt_dlp
            print("Trying to extract transcript using yt-dlp...")
            
            ydl_opts = {
                'writesubtitles': True,
                'writeautomaticsub': True,
                'subtitleslangs': ['en', 'en-US', 'en-GB'],
                'skip_download': True,
                'quiet': False,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(video_link, download=False)
                
                # Check for subtitles in the info
                if 'subtitles' in info or 'automatic_captions' in info:
                    # Try to download subtitles
                    ydl_opts_download = {
                        'writesubtitles': True,
                        'writeautomaticsub': True,
                        'subtitleslangs': ['en'],
                        'skip_download': True,
                        'outtmpl': os.path.join(os.path.dirname(os.path.realpath(__file__)), 'temp_downloads', '%(id)s.%(ext)s'),
                    }
                    
                    with yt_dlp.YoutubeDL(ydl_opts_download) as ydl2:
                        ydl2.extract_info(video_link, download=True)
                    
                    # Look for subtitle files
                    temp_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'temp_downloads')
                    subtitle_files = [f for f in os.listdir(temp_dir) if f.startswith(video_id) and (f.endswith('.vtt') or f.endswith('.srt') or f.endswith('.ttml'))]
                    
                    if subtitle_files:
                        # Parse VTT or SRT file
                        subtitle_file = os.path.join(temp_dir, subtitle_files[0])
                        print(f"Found subtitle file: {subtitle_file}")
                        
                        # Convert subtitle file to transcript format
                        transcript = parse_subtitle_file(subtitle_file)
                        if transcript:
                            transcript_source = "yt-dlp (automatic captions)"
                            print("Successfully extracted transcript using yt-dlp")
        except Exception as e:
            print(f"yt-dlp transcript extraction failed: {e}")
            import traceback
            print(traceback.format_exc())
    
    if transcript:
        save_transcript_to_json(transcript, 'transcript.json')
        print(f"Transcript saved from: {transcript_source}")
    else:
        # Additional fallback: check if subtitles for this video already exist in temp_downloads
        try:
            temp_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'temp_downloads')
            existing_subs = [f for f in os.listdir(temp_dir) if f.startswith(video_id) and (f.endswith('.vtt') or f.endswith('.srt') or f.endswith('.ttml'))]
            if existing_subs:
                subtitle_file = os.path.join(temp_dir, existing_subs[0])
                print(f"Using existing subtitle file: {subtitle_file}")
                transcript = parse_subtitle_file(subtitle_file)
                if transcript:
                    transcript_source = "existing subtitle file"
                    save_transcript_to_json(transcript, 'transcript.json')
                    print("Successfully parsed existing subtitle file")
        except Exception as e:
            print(f"Existing subtitle fallback failed: {e}")

    if not transcript:
        # If no transcript found, try FFmpeg fallback
        print("No transcript found via API or yt-dlp, trying FFmpeg fallback...")
        
        # Check if FFmpeg is available before trying fallback
        ffmpeg_available = False
        try:
            ffmpeg_path = resolve_ffmpeg_path()
            result = subprocess.run([ffmpeg_path, '-version'], capture_output=True, timeout=5)
            ffmpeg_available = (result.returncode == 0)
        except Exception:
            ffmpeg_available = False
        
        if not ffmpeg_available:
            return jsonify({
                'error': f'No transcript available for this video via any method.\n\n'
                        f'Options:\n'
                        f'1. Try a different video that has captions available (most YouTube videos have them)\n'
                        f'2. Install FFmpeg from https://ffmpeg.org/download.html for Windows\n'
                        f'3. After installing FFmpeg, add it to your system PATH or set env var FFMPEG_PATH to the executable\n\n'
                        f'Note: This video does not have captions available via YouTube API or yt-dlp.'
            }), 500
        
        try:
            # Define the YouTube link you want to process
            yt_link = video_link

            # Download the video from the provided link
            video_path = get_youtube(yt_link)

            # Convert the downloaded video to WAV format
            convert_to_wav(video_path)

            # Transcribe the WAV file
            segments = speech_to_text(video_path)

            # Save the transcript to a JSON file
            save_transcript_to_json(segments, 'transcript.json')
            transcript = segments
            transcript_source = "FFmpeg + Whisper (fallback transcription)"

        except Exception as e2:
            error_msg = str(e2)
            if 'FFmpeg not found' in error_msg or 'FFmpeg' in error_msg:
                return jsonify({
                    'error': f'No transcript available for this video, and FFmpeg is not installed for fallback transcription.\n\n'
                            f'Please try a different video that has captions available, or install FFmpeg from https://ffmpeg.org/download.html.\n'
                            f'Alternatively, set the environment variable FFMPEG_PATH to your ffmpeg executable.'
                }), 500
            return jsonify({
                'error': f'All transcript methods failed.\n\n'
                        f'YouTube API: No transcript available\n'
                        f'yt-dlp: No transcript available\n'
                        f'FFmpeg fallback error: {str(e2)}\n\n'
                        f'Please try a video with captions available.'
            }), 500

    try:
        # Get the directory of the current script file
        current_directory = os.path.dirname(os.path.realpath(__file__))

        # Construct the file path relative to the current directory
        file_path = os.path.join(current_directory, 'transcript.json')

        if not os.path.exists(file_path):
            return jsonify({'error': 'Transcript file not found. Both transcript methods failed.'}), 500

        print(f"Reading transcript from: {file_path}")
        subtitles = read_subtitle_json(file_path)

        if not subtitles:
            return jsonify({'error': 'Transcript is empty'}), 500

        paragraph = merge_subtitles_to_paragraph(subtitles)
        
        if not paragraph or paragraph.strip() == "":
            return jsonify({'error': 'No text could be extracted from transcript'}), 500

        print(f"Transcript length: {len(paragraph)} characters")
        
        # Split text into chunks for summarization
        chunk_texts = split_keep_context(paragraph)
        print(f"Split into {len(chunk_texts)} chunks for summarization")

        summaries = []
        for i, chunk_text in enumerate(chunk_texts):
            print(f"Summarizing chunk {i+1}/{len(chunk_texts)}...")
            try:
                summary = summarize(chunk_text)
                if summary and len(summary) > 0:
                    summaries.append(summary)
            except Exception as e:
                print(f"Error summarizing chunk {i+1}: {e}")
                # Continue with other chunks even if one fails
                continue

        if not summaries:
            return jsonify({'error': 'Failed to generate summary from any chunks. The transcript might be too short or the model failed to process it.'}), 500

        combined_summary = ""
        for i, summary in enumerate(summaries):
            if summary and len(summary) > 0 and 'summary_text' in summary[0]:
                combined_summary += summary[0]['summary_text'] + " "

        if not combined_summary.strip():
            return jsonify({'error': 'Summary was generated but is empty.'}), 500

        print(f"Generated summary length: {len(combined_summary)} characters")
        print(f"Summary: {combined_summary[:200]}...")

        return jsonify({'summary': combined_summary.strip()}), 200

    except FileNotFoundError as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"File not found error: {e}")
        print(f"Traceback: {error_trace}")
        return jsonify({'error': f'Transcript file not found: {str(e)}'}), 500
    except ValueError as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Value error: {e}")
        print(f"Traceback: {error_trace}")
        return jsonify({'error': f'Invalid transcript format: {str(e)}'}), 500
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error generating summary: {e}")
        print(f"Traceback: {error_trace}")
        return jsonify({'error': f'Error generating summary: {str(e)}'}), 500
    

@app.route('/upload-pdf', methods=['POST'])
def upload_pdf():
    # Check if the POST request has the file part
    print(request.files)
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']

    # If user does not select file, browser also
    # submit an empty part without filename
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        try:
            # Extract text from the PDF file
            print(f"Extracting text from PDF: {file_path}")
            extracted_text = extract_text_from_pdf(file_path)
            
            if not extracted_text or extracted_text.strip() == "":
                return jsonify({'error': 'No text could be extracted from the PDF. The PDF might be empty or contain only images without OCR support.'}), 400
            
            print(f"Extracted text length: {len(extracted_text)} characters")
            
            # Split text into chunks for summarization (same as video endpoint)
            chunk_texts = split_keep_context(extracted_text)
            print(f"Split into {len(chunk_texts)} chunks for summarization")
            
            # Check if model is ready
            print("Checking if summarization model is ready...")
            try:
                # Test with a small sample to ensure model is loaded
                test_text = extracted_text[:100] if len(extracted_text) > 100 else extracted_text
                if test_text.strip():
                    _ = summarize(test_text)
                    print("Model is ready!")
            except Exception as e:
                print(f"Model not ready or error: {e}")
                return jsonify({'error': f'Summarization model is not ready: {str(e)}. Please wait a moment and try again, or check the server console for details.'}), 500
            
            summaries = []
            for i, chunk_text in enumerate(chunk_texts):
                print(f"Summarizing chunk {i+1}/{len(chunk_texts)}...")
                try:
                    summary = summarize(chunk_text)
                    if summary and len(summary) > 0:
                        summaries.append(summary)
                    else:
                        print(f"Warning: Chunk {i+1} returned empty summary")
                except Exception as e:
                    print(f"Error summarizing chunk {i+1}: {e}")
                    import traceback
                    print(traceback.format_exc())
                    # Continue with other chunks even if one fails
                    continue
            
            if not summaries:
                return jsonify({'error': 'Failed to generate summary from any chunks. The text might be too short or the model failed to process it.'}), 500
            
            combined_summary = ""
            for i, summary in enumerate(summaries):
                if summary and len(summary) > 0 and 'summary_text' in summary[0]:
                    combined_summary += summary[0]['summary_text'] + " "
            
            if not combined_summary.strip():
                return jsonify({'error': 'Summary was generated but is empty.'}), 500
            
            print(f"Generated summary length: {len(combined_summary)} characters")
            
            return jsonify({'summary': combined_summary.strip()}), 200
            
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"Error processing PDF: {e}")
            print(f"Traceback: {error_trace}")
            return jsonify({'error': f'Error processing PDF: {str(e)}'}), 500

    return jsonify({'error': 'Invalid file type'}), 400

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
