"""
Auto-inject Tekkzy preview-bridge into template HTML whenever an .html
object is uploaded to the products.tekkzy.com bucket.

Upload templates as often as you want — scroll/highlight keep working
without manual HTML patches or builder code changes.
"""
import json
import urllib.parse

import boto3

s3 = boto3.client("s3")
BRIDGE_SRC = "/_tekkzy/preview-bridge.js"
SCRIPT_TAG = f'<script src="{BRIDGE_SRC}" defer></script>'


def inject_bridge(html: str):
    if not html:
        return None
    if BRIDGE_SRC in html or "preview-bridge.js" in html:
        return None
    lower = html.lower()
    idx = lower.find("</head>")
    if idx != -1:
        return html[:idx] + f"  {SCRIPT_TAG}\n" + html[idx:]
    idx = lower.find("</body>")
    if idx != -1:
        return html[:idx] + f"  {SCRIPT_TAG}\n" + html[idx:]
    return html + f"\n{SCRIPT_TAG}\n"


def handler(event, _context):
    results = []
    for record in event.get("Records", []):
        bucket = record["s3"]["bucket"]["name"]
        key = urllib.parse.unquote_plus(record["s3"]["object"]["key"])
        if not key.lower().endswith(".html") or key.startswith("_tekkzy/"):
            continue
        try:
            obj = s3.get_object(Bucket=bucket, Key=key)
            body = obj["Body"].read().decode("utf-8", errors="replace")
            next_html = inject_bridge(body)
            if next_html is None:
                results.append({"key": key, "status": "skipped"})
                continue
            extra_args = {
                "ContentType": "text/html; charset=utf-8",
                "CacheControl": obj.get("CacheControl") or "no-cache, max-age=0",
                "Metadata": {**(obj.get("Metadata") or {}), "tekkzy-preview-bridge": "1"},
            }
            s3.put_object(Bucket=bucket, Key=key, Body=next_html.encode("utf-8"), **extra_args)
            results.append({"key": key, "status": "patched"})
        except Exception as exc:  # noqa: BLE001
            print("Failed", key, exc)
            results.append({"key": key, "status": "error", "error": str(exc)})
    print(json.dumps(results))
    return {"ok": True, "results": results}
