import os
import sys

# Ensure we can import server.py as a module
sys.path.append(os.path.dirname(os.path.realpath(__file__)))
import server as srv

def summarize_from_vtt(vtt_filename: str):
    base_dir = os.path.dirname(os.path.realpath(__file__))
    path = os.path.join(base_dir, 'temp_downloads', vtt_filename)
    transcript = srv.parse_subtitle_file(path)
    srv.save_transcript_to_json(transcript, 'transcript.json')
    paragraph = srv.merge_subtitles_to_paragraph(transcript)
    chunks = srv.split_keep_context(paragraph)
    summaries = []
    for ch in chunks:
        try:
            summaries.extend(srv.summarize(ch))
        except Exception as e:
            print('Summarize chunk error:', e)
    text = ' '.join([s['summary_text'] for s in summaries if 'summary_text' in s])
    print('\n=== Combined Summary ===\n')
    print(text)

if __name__ == '__main__':
    # Use an existing VTT to demonstrate summary creation without FFmpeg
    summarize_from_vtt('dQw4w9WgXcQ.en.vtt')