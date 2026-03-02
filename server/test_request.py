import json
import requests

def post_summary(video_url: str):
    resp = requests.post(
        "http://127.0.0.1:5000/generate-summary",
        headers={"Content-Type": "application/json"},
        data=json.dumps({"video_link": video_url})
    )
    print("Status:", resp.status_code)
    try:
        print(resp.json())
    except Exception:
        print(resp.text)

if __name__ == "__main__":
    import sys
    url = sys.argv[1] if len(sys.argv) > 1 else "https://www.youtube.com/watch?v=L9lZPW98Ou4"
    post_summary(url)