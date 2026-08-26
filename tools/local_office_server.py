#!/usr/bin/env python3
"""Field Ledger local office server — stdlib only.

Mirrors the original Maichle's Edge Netlify /api/sync and /api/push so the shop
computer can keep punches, payroll, invoices, and receipts without extra brew
packages.

Usage (from the project root, or anywhere — data lives next to this file):

    python3 tools/local_office_server.py
    python3 tools/local_office_server.py --port 8787 --dir ./office-data

Endpoints
    GET    /api/sync     header x-sync-key: <company key, 6+ chars>
    PUT    /api/sync     same header; JSON body { rev, data }
    POST   /api/push     actions: subscribe | send | backup
    GET    /health

Files written under office-data/
    sync-<key>.json
    push-<key>.json
    backups/<key>-<timestamp>.json
    backups/<key>-<timestamp>-timecards.csv  (when data includes csv)

No third-party modules. Python 3.9+ from the OS is enough.
"""

from __future__ import annotations

import argparse
import json
import os
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


def now_ms() -> int:
    return int(time.time() * 1000)


class Store:
    def __init__(self, root: Path) -> None:
        self.root = root
        self.root.mkdir(parents=True, exist_ok=True)
        (self.root / "backups").mkdir(exist_ok=True)

    def _path(self, prefix: str, key: str) -> Path:
        safe = "".join(c if c.isalnum() or c in "-_" else "_" for c in key)[:80]
        return self.root / f"{prefix}-{safe}.json"

    def read(self, prefix: str, key: str):
        path = self._path(prefix, key)
        if not path.exists():
            return None
        return json.loads(path.read_text(encoding="utf-8"))

    def write(self, prefix: str, key: str, payload) -> None:
        path = self._path(prefix, key)
        tmp = path.with_suffix(".tmp")
        tmp.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        tmp.replace(path)

    def backup(self, key: str, payload) -> Path:
        stamp = time.strftime("%Y%m%d-%H%M%S")
        safe = "".join(c if c.isalnum() or c in "-_" else "_" for c in key)[:80]
        path = self.root / "backups" / f"{safe}-{stamp}.json"
        path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        csv_blob = (payload.get("data") or {}).get("csv") if isinstance(payload, dict) else None
        if isinstance(csv_blob, dict):
            for name, text in csv_blob.items():
                if isinstance(text, str):
                    (self.root / "backups" / f"{safe}-{stamp}-{name}.csv").write_text(text, encoding="utf-8")
        return path


def merge(local, remote):
    if not local:
        return remote
    if not remote:
        return local
    if not isinstance(local, dict) or not isinstance(remote, dict):
        return remote
    out = dict(local)
    out.update(remote)
    return out


class Handler(BaseHTTPRequestHandler):
    store: Store

    def log_message(self, fmt: str, *args) -> None:
        sys_stderr = __import__("sys").stderr
        sys_stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def _cors(self) -> None:
        self.send_header("access-control-allow-origin", "*")
        self.send_header("access-control-allow-headers", "content-type, x-sync-key, x-field-key")
        self.send_header("access-control-allow-methods", "GET, PUT, POST, OPTIONS")

    def _send(self, status: int, body) -> None:
        raw = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self._cors()
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _key(self) -> str:
        return (self.headers.get("x-sync-key") or self.headers.get("x-field-key") or "").strip()

    def _body(self):
        length = int(self.headers.get("content-length") or 0)
        if length <= 0:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8") or "{}")

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path.rstrip("/") or "/"
        if path in ("/", "/index.html", "/console"):
            html = (Path(__file__).resolve().parent / "office_console.html").read_bytes()
            self.send_response(200)
            self._cors()
            self.send_header("content-type", "text/html; charset=utf-8")
            self.send_header("content-length", str(len(html)))
            self.end_headers()
            self.wfile.write(html)
            return
        if path == "/health":
            self._send(200, {"ok": True, "dir": str(self.store.root)})
            return
        if path == "/api/sync":
            key = self._key()
            if len(key) < 6:
                self._send(401, {"error": "Company key required"})
                return
            data = self.store.read("sync", key) or {"rev": 0, "at": 0, "data": None}
            self._send(200, data)
            return
        self._send(404, {"error": "Not found"})

    def do_PUT(self) -> None:  # noqa: N802
        path = urlparse(self.path).path.rstrip("/") or "/"
        if path != "/api/sync":
            self._send(405, {"error": "Method"})
            return
        key = self._key()
        if len(key) < 6:
            self._send(401, {"error": "Company key required"})
            return
        body = self._body()
        cur = self.store.read("sync", key) or {"rev": 0, "at": 0, "data": None}
        next_doc = {
            "rev": max(cur.get("rev") or 0, body.get("rev") or 0) + 1,
            "at": now_ms(),
            "data": merge(cur.get("data"), body.get("data")),
            "actor": "office-python",
        }
        self.store.write("sync", key, next_doc)
        self.store.backup(key, next_doc)
        self._send(200, next_doc)

    def do_POST(self) -> None:  # noqa: N802
        path = urlparse(self.path).path.rstrip("/") or "/"
        if path != "/api/push":
            self._send(405, {"error": "POST only on /api/push"})
            return
        key = self._key()
        if len(key) < 6:
            self._send(401, {"error": "Company key required"})
            return
        body = self._body()
        action = body.get("action")
        if action == "subscribe" and (body.get("subscription") or {}).get("endpoint"):
            all_subs = self.store.read("push", key) or {}
            user = body.get("user") or body.get("fromUser") or "office"
            lst = [s for s in (all_subs.get(user) or []) if s.get("endpoint") != body["subscription"]["endpoint"]]
            lst.append({**body["subscription"], "device": body.get("deviceName") or "", "at": now_ms()})
            all_subs[user] = lst[-4:]
            self.store.write("push", key, all_subs)
            self._send(200, {"ok": True, "user": user})
            return
        if action == "send":
            all_subs = self.store.read("push", key) or {}
            to_user = body.get("toUser") or "all"
            targets = []
            if to_user in ("all", "*shop*", "shop"):
                for user, subs in all_subs.items():
                    if user == body.get("fromUser"):
                        continue
                    targets.extend(subs or [])
            else:
                targets.extend(all_subs.get(to_user) or [])
            print(
                "PUSH %s -> %s targets: %s"
                % (body.get("title") or "Field Ledger", len(targets), body.get("body") or "")
            )
            self._send(200, {"sent": len(targets), "results": ["queued"] * len(targets)})
            return
        if action == "backup":
            doc = {"rev": now_ms(), "at": now_ms(), "data": body.get("data"), "actor": "backup"}
            self.store.write("sync", key, doc)
            path_written = self.store.backup(key, doc)
            self._send(200, {"ok": True, "file": str(path_written)})
            return
        self._send(400, {"error": "Unknown action"})


def main() -> None:
    here = Path(__file__).resolve().parent
    default_dir = here.parent / "office-data"
    parser = argparse.ArgumentParser(description="Field Ledger local office sync/push server")
    parser.add_argument("--host", default=os.environ.get("FIELD_OFFICE_HOST", "0.0.0.0"))
    parser.add_argument("--port", type=int, default=int(os.environ.get("FIELD_OFFICE_PORT", "8787")))
    parser.add_argument("--dir", default=str(default_dir))
    args = parser.parse_args()
    Handler.store = Store(Path(args.dir))
    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    print("Field Ledger office server  http://%s:%s" % (args.host, args.port))
    print("  data dir  %s" % Handler.store.root)
    print("  console   http://%s:%s/" % (args.host, args.port))
    print("  GET/PUT /api/sync   POST /api/push   GET /health")
    print("  header  x-sync-key: <company key>")
    print("  GUI     python3 tools/office_gui.py")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")


if __name__ == "__main__":
    main()
