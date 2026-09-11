#!/usr/bin/env python3
"""Fetch a YouTube transcript as JSON cues. Used by fetch.ts when the venv exists."""

from __future__ import annotations

import json
import sys


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "usage", "message": "video id required"}))
        return 2
    video_id = sys.argv[1]
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
    except ImportError as exc:
        print(json.dumps({"error": "ImportError", "message": str(exc)}))
        return 2

    api = YouTubeTranscriptApi()
    try:
        fetched = api.fetch(video_id, languages=["en", "en-US", "en-GB"])
        print(json.dumps(fetched.to_raw_data()))
        return 0
    except Exception:
        try:
            fetched = api.fetch(video_id)
            print(json.dumps(fetched.to_raw_data()))
            return 0
        except Exception as exc:
            print(json.dumps({"error": type(exc).__name__, "message": str(exc)}))
            return 2


if __name__ == "__main__":
    raise SystemExit(main())
