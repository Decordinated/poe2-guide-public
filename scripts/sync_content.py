#!/usr/bin/env python3
"""Build a public, transcript-free data bundle from the private guide archive."""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

PUBLIC_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = PUBLIC_ROOT.parent / "poe2-guide"
SOURCE = Path(sys.argv[1]).expanduser().resolve() if len(sys.argv) > 1 else DEFAULT_SOURCE.resolve()
OUT = PUBLIC_ROOT / "public" / "data" / "content.json"


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""


def plain(text: str) -> str:
    text = re.sub(r"```.*?```", " ", text, flags=re.S)
    text = re.sub(r"!?\[([^\]]+)\]\([^\)]+\)", r"\1", text)
    text = re.sub(r"[`*_>#|~-]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def make_summary(markdown: str) -> str:
    match = re.search(r"## 한 줄 결론\s+(.+?)(?:\n##|\Z)", markdown, flags=re.S)
    candidate = match.group(1) if match else ""
    if not candidate:
        match = re.search(r"^\s*-\s+\*\*(?:요약|핵심|Summary)\*\*:\s*(.+)$", markdown, flags=re.M | re.I)
        candidate = match.group(1) if match else ""
    if not candidate:
        candidate = "타임스탬프와 원문 근거로 장비, 스킬, 제작 및 운영 판단을 정리한 영상 가이드입니다."
    value = plain(candidate)
    return value[:240] + ("…" if len(value) > 240 else "")


def main() -> None:
    youtuber = SOURCE / "youtuber"
    if not youtuber.is_dir():
        raise SystemExit(f"Missing source archive: {youtuber}")

    videos = []
    for channel_dir in sorted(p for p in youtuber.iterdir() if p.is_dir()):
        index_path = channel_dir / "index.json"
        if not index_path.exists():
            continue
        entries = json.loads(index_path.read_text(encoding="utf-8"))
        for entry in entries:
            video_id = entry.get("video_id")
            if not video_id:
                continue
            video_dir = channel_dir / "videos" / video_id
            meta_path = video_dir / "meta.json"
            tips = read_text(video_dir / "tips.md")
            craft = read_text(video_dir / "craft.md")
            if not meta_path.exists() or not tips:
                continue
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
            videos.append({
                "id": video_id,
                "channel": meta.get("channel") or channel_dir.name,
                "title": meta.get("title") or entry.get("title") or video_id,
                "uploadDate": meta.get("upload_date") or entry.get("upload_date") or "",
                "durationSeconds": meta.get("duration_seconds"),
                "url": meta.get("url") or entry.get("url") or f"https://www.youtube.com/watch?v={video_id}",
                "pobUrl": meta.get("pob_url") or entry.get("pob_url"),
                "patch": meta.get("patch"),
                "series": meta.get("series"),
                "summary": make_summary(tips),
                "tips": tips,
                "craft": craft,
                "contentType": meta.get("content_type") or entry.get("content_type") or "video",
            })

    videos.sort(key=lambda item: (item["uploadDate"], item["channel"], item["title"]), reverse=True)
    channels = {video["channel"] for video in videos}
    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "channelCount": len(channels),
        "videoCount": len(videos),
        "videos": videos,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"synced channels={len(channels)} videos={len(videos)} -> {OUT}")


if __name__ == "__main__":
    main()
