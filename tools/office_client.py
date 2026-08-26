#!/usr/bin/env python3
"""Field Ledger / Maichle's Edge office sync client — stdlib only.

Same contract as the original Netlify functions and the shop computer GUI:

    GET  {base}/api/sync     header x-sync-key
    PUT  {base}/api/sync     header x-sync-key   body { rev, data }
    POST {base}/api/push     header x-sync-key   body { action, ... }
    GET  {base}/health

Import this from your own Python GUI:

    from office_client import SyncClient
    c = SyncClient("https://your-site.netlify.app", "maichles-office")
    doc = c.pull()          # { rev, at, data }
    c.push(doc["data"])     # write back
    c.backup(doc["data"])   # snapshot on the server

CLI:

    python3 tools/office_client.py pull  --url http://127.0.0.1:8787 --key maichles-office
    python3 tools/office_client.py push  --url ... --key ... --file office-data/sync-maichles-office.json
    python3 tools/office_client.py ping  --url ...
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any


class SyncError(RuntimeError):
    pass


class SyncClient:
    def __init__(self, url: str, key: str, timeout: float = 12.0) -> None:
        self.base = (url or "").rstrip("/")
        self.key = (key or "").strip()
        self.timeout = timeout

    def _headers(self, extra: dict[str, str] | None = None) -> dict[str, str]:
        h = {
            "Accept": "application/json",
            "x-sync-key": self.key,
            "x-field-key": self.key,
        }
        if extra:
            h.update(extra)
        return h

    def _url(self, path: str) -> str:
        if not self.base:
            raise SyncError("No server URL set")
        if path.startswith("http"):
            return path
        return self.base + path

    def _request(self, method: str, path: str, body: Any | None = None) -> Any:
        data = None
        headers = self._headers()
        if body is not None:
            data = json.dumps(body).encode("utf-8")
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(self._url(path), data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as res:
                raw = res.read().decode("utf-8") or "{}"
                return json.loads(raw)
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", errors="replace")[:400]
            try:
                parsed = json.loads(detail)
                msg = parsed.get("error") or parsed.get("message") or detail
            except Exception:
                msg = detail or str(e)
            raise SyncError("%s %s: %s" % (e.code, path, msg)) from e
        except urllib.error.URLError as e:
            raise SyncError("Could not reach %s (%s)" % (self.base or path, e.reason)) from e

    def health(self) -> dict:
        return self._request("GET", "/health")

    def pull(self) -> dict:
        if len(self.key) < 6:
            raise SyncError("Company key must be at least 6 characters")
        return self._request("GET", "/api/sync")

    def push(self, data: Any, rev: int = 0) -> dict:
        if len(self.key) < 6:
            raise SyncError("Company key must be at least 6 characters")
        return self._request("PUT", "/api/sync", {"rev": rev, "data": data})

    def backup(self, data: Any) -> dict:
        return self._request("POST", "/api/push", {"action": "backup", "data": data})

    def send_push(self, title: str, body: str, to_user: str = "all") -> dict:
        return self._request(
            "POST",
            "/api/push",
            {"action": "send", "title": title, "body": body, "toUser": to_user, "fromUser": "office"},
        )


def load_payload(path: Path) -> Any:
    doc = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(doc, dict) and "data" in doc:
        return doc
    return {"rev": 0, "data": doc}


def main() -> int:
    p = argparse.ArgumentParser(description="Field Ledger office sync (pull / push / ping)")
    p.add_argument("action", choices=["pull", "push", "ping", "backup"])
    p.add_argument("--url", required=True, help="Office server or Netlify origin, no trailing slash needed")
    p.add_argument("--key", default="maichles-office")
    p.add_argument("--file", help="JSON file to push, or where pull is written")
    args = p.parse_args()
    client = SyncClient(args.url, args.key)
    try:
        if args.action == "ping":
            print(json.dumps(client.health(), indent=2))
            return 0
        if args.action == "pull":
            doc = client.pull()
            if args.file:
                Path(args.file).write_text(json.dumps(doc, indent=2), encoding="utf-8")
                print("wrote", args.file, "rev", doc.get("rev"))
            else:
                print(json.dumps(doc, indent=2)[:4000])
            return 0
        if args.action in ("push", "backup"):
            if not args.file:
                raise SyncError("--file is required for push/backup")
            doc = load_payload(Path(args.file))
            out = client.backup(doc.get("data")) if args.action == "backup" else client.push(doc.get("data"), doc.get("rev") or 0)
            print(json.dumps({k: out.get(k) for k in ("ok", "rev", "at", "file") if k in out or k == "rev"}, indent=2))
            return 0
    except SyncError as e:
        print("error:", e, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
