#!/usr/bin/env python3
"""
Extract transcript from YouTube video using youtube-transcript-api
"""

import sys
import json
from urllib.parse import urlparse, parse_qs

def extract_video_id(youtube_url: str) -> str:
    """Extract video ID from YouTube URL"""
    parsed_url = urlparse(youtube_url)
    
    # Handle youtu.be short URLs
    if parsed_url.netloc in ('youtu.be', 'www.youtu.be'):
        return parsed_url.path.lstrip('/')
    
    # Handle youtube.com URLs
    if parsed_url.netloc in ('youtube.com', 'www.youtube.com'):
        query_params = parse_qs(parsed_url.query)
        if 'v' in query_params:
            return query_params['v'][0]
    
    # If it's just a video ID
    if len(youtube_url) == 11 and youtube_url.replace('_', '').replace('-', '').isalnum():
        return youtube_url
    
    raise ValueError(f"Invalid YouTube URL: {youtube_url}")


def get_transcript(youtube_url: str) -> dict:
    """Get transcript from YouTube video"""
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        
        video_id = extract_video_id(youtube_url)
        
        # Get transcript
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        
        # Combine all text into a single string
        full_transcript = ' '.join([item['text'] for item in transcript])
        
        return {
            'success': True,
            'video_id': video_id,
            'transcript': full_transcript,
            'segments': transcript
        }
    except ImportError:
        return {
            'success': False,
            'error': 'youtube-transcript-api not installed. Install with: pip install youtube-transcript-api'
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python extract_transcript.py <youtube_url>'
        }))
        sys.exit(1)
    
    youtube_url = sys.argv[1]
    result = get_transcript(youtube_url)
    print(json.dumps(result))
