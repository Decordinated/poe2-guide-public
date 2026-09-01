#!/usr/bin/env python3
import json
import re
from pathlib import Path

path = Path(__file__).resolve().parents[1] / "public" / "data" / "content.json"
public_root = path.parents[1]
data = json.loads(path.read_text(encoding="utf-8"))
assert data["videoCount"] == len(data["videos"]), "video count mismatch"
assert data["channelCount"] == len({v["channel"] for v in data["videos"]}), "channel count mismatch"
ids = [v["id"] for v in data["videos"]]
assert len(ids) == len(set(ids)), "duplicate video ids"
for video in data["videos"]:
    for key in ("id", "channel", "title", "url", "tips"):
        assert video.get(key), f"{video.get('id')}: missing {key}"
    assert video["url"].startswith("https://www.youtube.com/"), f"{video['id']}: invalid source URL"
    for markdown_key in ("tips", "craft"):
        markdown = video.get(markdown_key, "")
        for image_ref in re.findall(r"!\[[^\]]*\]\((?!https?://)([^)]+)\)", markdown):
            image_path = (public_root / image_ref).resolve()
            image_path.relative_to(public_root.resolve())
            assert image_path.is_file() and image_path.stat().st_size > 0, (
                f"{video['id']}: missing public image {image_ref}"
            )
blob = path.read_text(encoding="utf-8")
patterns = {
    "secret key": r"(?i)(github_pat_|ghp_|sk-[A-Za-z0-9]{20,}|-----BEGIN (?:RSA |OPENSSH )?PRIVATE KEY-----)",
    "local path": r"/(?:Users|home)/[^/\s]+/",
    "private network": r"(?:192\.168\.|127\.0\.0\.1|localhost)",
}
for label, pattern in patterns.items():
    assert not re.search(pattern, blob), f"public data contains {label}"
assert "transcript" not in data["videos"][0], "raw transcripts must not be published"
print(f"validated public bundle channels={data['channelCount']} videos={data['videoCount']}")
