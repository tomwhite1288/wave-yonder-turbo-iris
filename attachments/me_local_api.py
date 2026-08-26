#!/usr/bin/env python3
"""MaichlesEdge local API — stands in for netlify/functions.

Put this file NEXT TO index.html (the unzipped site). Do not change the app.

    python3 me_local_api.py

Then open the LAN URL it prints (same address on the Mac and every phone).
In the app: Admin → Cloud sync → New key → turn sync ON.
Leave Site URL blank (same origin) or set it to that LAN URL.

Implements:
  GET/PUT  /api/sync     company blob (x-sync-key)
  GET/POST /api/auth     login, me, provision, …
  POST     /api/push     subscribe / send (stores subs; OS push needs HTTPS)

Data is saved in ./me-data/ next to this script.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import secrets
import socket
import sys
import threading
import time
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

try:
    from http.server import ThreadingHTTPServer as Server
except ImportError:
    from socketserver import ThreadingTCPServer as Server  # type: ignore

PORT = int(os.environ.get("ME_PORT", "8080"))
ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, "me-data")
COOKIE = "me_sid"
LOCK = threading.Lock()

DEMO = [
    ("admin", "Administrator", "admin"),
    ("thomas", "Thomas White", "tech"),
    ("devon", "Devon Hale", "tech"),
    ("alex", "Alex Rivera", "dispatch"),
    ("jordan", "Jordan Hale", "management"),
    ("owner", "Shop Owner", "owner"),
    ("lee", "Lee Chen", "supervisor"),
    ("pat", "Pat Morgan", "hr"),
    ("morgan", "Morgan Ellis", "parts"),
]


def now_ms() -> int:
    return int(time.time() * 1000)


def lan_ip() -> str | None:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("8.8.8.8", 80))
        return sock.getsockname()[0]
    except OSError:
        return None
    finally:
        sock.close()


def safe_key(raw: str) -> str:
    return re.sub(r"[^a-zA-Z0-9._-]", "_", (raw or "").strip())[:80]


def read_json(path: str, default):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return default


def write_json(path: str, value) -> None:
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(value, f)
    os.replace(tmp, path)


def blob_path(name: str) -> str:
    return os.path.join(DATA, safe_key(name) + ".json")


def blob_get(name: str):
    return read_json(blob_path(name), None)


def blob_put(name: str, value) -> None:
    write_json(blob_path(name), value)


def sha256(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def new_id() -> str:
    return secrets.token_hex(16)


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    buf = hashlib.scrypt(password.encode("utf-8"), salt=salt.encode("utf-8"), n=16384, r=8, p=1, dklen=32)
    return f"scrypt:{salt}:{buf.hex()}"


def verify_password(password: str, stored: str) -> bool:
    parts = str(stored or "").split(":")
    if len(parts) != 3 or parts[0] != "scrypt":
        return False
    buf = hashlib.scrypt(password.encode("utf-8"), salt=parts[1].encode("utf-8"), n=16384, r=8, p=1, dklen=32)
    return secrets.compare_digest(buf.hex(), parts[2])


def public_user(u: dict | None) -> dict | None:
    if not u:
        return None
    return {
        "user": u.get("user"),
        "name": u.get("name"),
        "role": u.get("role"),
        "email": u.get("email") or "",
        "active": u.get("active") is not False,
    }


def load_users() -> dict:
    return blob_get("auth-users") or {}


def save_users(users: dict) -> None:
    blob_put("auth-users", users)


def load_sessions() -> dict:
    return blob_get("auth-sessions") or {}


def save_sessions(rows: dict) -> None:
    blob_put("auth-sessions", rows)


def ensure_demo_users() -> dict:
    users = load_users()
    if users:
        return users
    pin = os.environ.get("AUTH_DEMO_PASSWORD", "1234")
    hashed = hash_password(pin)
    t = now_ms()
    for user, name, role in DEMO:
        users[user] = {
            "user": user,
            "name": name,
            "role": role,
            "email": user + "@shop.local",
            "passwordHash": hashed,
            "active": True,
            "pending": False,
            "createdAt": t,
            "lastLoginAt": 0,
        }
    save_users(users)
    return users


def parse_cookies(header: str) -> dict:
    out = {}
    for part in (header or "").split(";"):
        if "=" not in part:
            continue
        k, v = part.split("=", 1)
        out[k.strip()] = v.strip()
    return out


def cookie_header(token: str, max_age: int) -> str:
    val = token if max_age > 0 else ""
    maxs = f"; Max-Age={max_age}" if max_age > 0 else "; Max-Age=0"
    return f"{COOKIE}={val}; Path=/; HttpOnly; SameSite=Lax{maxs}"


def read_session(headers) -> dict | None:
    raw = parse_cookies(headers.get("Cookie") or "").get(COOKIE, "")
    if "." not in raw:
        return None
    sid, secret = raw.split(".", 1)
    sessions = load_sessions()
    row = sessions.get(sid)
    if not row or row.get("revokedAt") or row.get("expiresAt", 0) < now_ms():
        return None
    if row.get("tokenHash") != sha256(secret):
        return None
    user = load_users().get(row.get("user"))
    if not user or user.get("active") is False:
        return None
    row["lastSeen"] = now_ms()
    sessions[sid] = row
    save_sessions(sessions)
    return {"session": row, "user": user}


def create_session(user: dict, remember: bool, device: str) -> tuple[str, int, dict]:
    sessions = load_sessions()
    sid = new_id()
    secret = new_id() + new_id()
    max_age = 60 * 60 * 24 * 30 if remember else 60 * 60 * 12
    row = {
        "id": sid,
        "user": user["user"],
        "tokenHash": sha256(secret),
        "deviceName": str(device or "device")[:80],
        "createdAt": now_ms(),
        "lastSeen": now_ms(),
        "expiresAt": now_ms() + max_age * 1000,
        "revokedAt": None,
        "rememberMe": bool(remember),
    }
    sessions[sid] = row
    save_sessions(sessions)
    return f"{sid}.{secret}", max_age, row


def merge_by_id(a, b, id_fn, time_fn):
    m = {}
    for x in list(a or []) + list(b or []):
        if not isinstance(x, dict):
            continue
        k = id_fn(x)
        if not k:
            continue
        prev = m.get(k)
        if not prev or (time_fn(x) or 0) > (time_fn(prev) or 0):
            m[k] = x
    return list(m.values())


def merge_accounts(a=None, b=None):
    out = dict(a or {})
    for k, v in (b or {}).items():
        cur = out.get(k)
        if not cur:
            out[k] = v
            continue
        out[k] = {
            **cur,
            **v,
            "pin": "",
            "pinUpdatedAt": max(v.get("pinUpdatedAt") or 0, cur.get("pinUpdatedAt") or 0),
            "layoutMode": cur.get("layoutMode") or v.get("layoutMode"),
            "themeId": v.get("themeId") or cur.get("themeId"),
            "themeAccent": v.get("themeAccent") or cur.get("themeAccent"),
        }
    return out


def stamp(x: dict) -> int:
    return x.get("updatedAt") or x.get("at") or x.get("createdAt") or 0


def merge_data(local, remote):
    if not local:
        return remote
    if not remote:
        return local
    ls = local.get("settings") or {}
    rs = remote.get("settings") or {}
    header = ls.get("invoiceHeaderImage") or ""
    return {
        **local,
        **remote,
        "codes": remote.get("codes") if len(remote.get("codes") or []) >= len(local.get("codes") or []) else local.get("codes"),
        "invoices": merge_by_id(local.get("invoices"), remote.get("invoices"), lambda i: i.get("id"), stamp),
        "accounts": merge_accounts(local.get("accounts"), remote.get("accounts")),
        "customers": merge_by_id(local.get("customers"), remote.get("customers"), lambda c: c.get("id"), lambda _: 0),
        "employees": merge_by_id(local.get("employees"), remote.get("employees"), lambda e: e.get("id"), lambda _: 0),
        "settings": {
            **ls,
            **rs,
            "skipPicker": ls.get("skipPicker") if ls.get("skipPicker") is not None else rs.get("skipPicker"),
            "invoiceHeaderImage": header if str(header).startswith("data:") else (rs.get("invoiceHeaderImage") or header),
            "syncCloudKey": ls.get("syncCloudKey") or rs.get("syncCloudKey") or "",
            "syncKey": ls.get("syncKey") or rs.get("syncKey"),
            "unlockKey": ls.get("unlockKey") or rs.get("unlockKey"),
        },
        "timeEntries": merge_by_id(local.get("timeEntries"), remote.get("timeEntries"), lambda t: t.get("id"), lambda t: t.get("in") or 0),
        "recoveryCode": remote.get("recoveryCode") or local.get("recoveryCode"),
        "parts": merge_by_id(local.get("parts"), remote.get("parts"), lambda p: p.get("sku"), lambda _: 0),
        "purchaseOrders": merge_by_id(local.get("purchaseOrders"), remote.get("purchaseOrders"), lambda p: p.get("id"), lambda p: p.get("at") or 0),
        "recurrences": merge_by_id(local.get("recurrences"), remote.get("recurrences"), lambda r: r.get("id"), lambda _: 0),
        "customReminders": merge_by_id(local.get("customReminders"), remote.get("customReminders"), lambda r: r.get("id"), lambda r: r.get("at") or 0),
        "messages": merge_by_id(local.get("messages"), remote.get("messages"), lambda m: m.get("id"), lambda m: m.get("at") or 0),
        "chatGroups": merge_by_id(local.get("chatGroups"), remote.get("chatGroups"), lambda g: g.get("id"), lambda g: g.get("createdAt") or 0),
        "trucks": merge_by_id(local.get("trucks"), remote.get("trucks"), lambda t: t.get("id"), lambda t: t.get("updatedAt") or 0),
        "stockRequests": merge_by_id(local.get("stockRequests"), remote.get("stockRequests"), lambda r: r.get("id"), lambda r: r.get("at") or 0),
        "notices": merge_by_id(local.get("notices"), remote.get("notices"), lambda n: n.get("id"), lambda n: n.get("at") or 0),
        "locations": merge_by_id(local.get("locations"), remote.get("locations"), lambda x: x.get("user"), lambda x: x.get("at") or 0),
        "deviceSessions": merge_by_id(local.get("deviceSessions"), remote.get("deviceSessions"), lambda x: x.get("id"), lambda x: x.get("lastSeen") or 0),
        "supportTickets": merge_by_id(local.get("supportTickets"), remote.get("supportTickets"), lambda x: x.get("id"), stamp),
        "schedules": merge_by_id(local.get("schedules"), remote.get("schedules"), lambda x: x.get("user"), lambda x: x.get("updatedAt") or 0),
        "callSignals": merge_by_id(local.get("callSignals"), remote.get("callSignals"), lambda x: x.get("id"), lambda x: x.get("at") or 0),
        "auditLog": merge_by_id(local.get("auditLog"), remote.get("auditLog"), lambda x: x.get("id"), lambda x: x.get("at") or 0),
        "chatRead": {**(remote.get("chatRead") or {}), **(local.get("chatRead") or {})},
        "mutedReminders": {**(remote.get("mutedReminders") or {}), **(local.get("mutedReminders") or {})},
    }


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        sys.stdout.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))
        sys.stdout.flush()

    def end_headers(self):
        origin = self.headers.get("Origin") or "*"
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.send_header("Access-Control-Allow-Headers", "content-type, x-sync-key")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Vary", "Origin")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def _json(self, body, status=200, extra=None):
        raw = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        if extra:
            for k, v in extra.items():
                self.send_header(k, v)
        self.end_headers()
        self.wfile.write(raw)

    def _read_body(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n <= 0:
            return {}
        raw = self.rfile.read(n)
        try:
            return json.loads(raw.decode("utf-8"))
        except Exception:
            return {}

    def _path(self):
        return urlparse(self.path).path.rstrip("/") or "/"

    def do_GET(self):
        path = self._path()
        if path == "/api/sync":
            return self._sync_get()
        if path == "/api/auth":
            return self._auth()
        if path.startswith("/api/"):
            return self._json({"error": "Not found"}, 404)
        # SPA: unknown paths that are not files become index.html
        rel = path.lstrip("/")
        if rel and not os.path.isfile(os.path.join(ROOT, rel)):
            self.path = "/index.html"
        return super().do_GET()

    def do_PUT(self):
        if self._path() == "/api/sync":
            return self._sync_put()
        self._json({"error": "Method"}, 405)

    def do_POST(self):
        path = self._path()
        if path == "/api/auth":
            return self._auth()
        if path == "/api/push":
            return self._push()
        self._json({"error": "Method"}, 405)

    def _sync_get(self):
        with LOCK:
            key = (self.headers.get("x-sync-key") or "").strip()
            if len(key) < 6:
                return self._json({"error": "Company key required"}, 401)
            data = blob_get("sync-" + key)
            return self._json(data or {"rev": 0, "at": 0, "data": None})

    def _sync_put(self):
        with LOCK:
            key = (self.headers.get("x-sync-key") or "").strip()
            if len(key) < 6:
                return self._json({"error": "Company key required"}, 401)
            body = self._read_body()
            cur = blob_get("sync-" + key) or {"rev": 0, "at": 0, "data": None}
            auth = read_session(self.headers)
            # Local PIN logins have no cookie. Still sync. If a session exists, honor role locks.
            if auth:
                denied = self._authorize(auth["user"], cur, body)
                if denied:
                    return self._json({"error": denied}, 403)
            nxt = {
                "rev": max(int(cur.get("rev") or 0), int(body.get("rev") or 0)) + 1,
                "at": now_ms(),
                "data": merge_data(cur.get("data"), body.get("data")),
                "actor": (auth["user"]["user"] if auth else "local"),
            }
            blob_put("sync-" + key, nxt)
            return self._json(nxt)

    def _authorize(self, actor, prev, nxt):
        if actor.get("active") is False:
            return "Account disabled"
        if actor.get("role") == "admin":
            return None
        ps = (prev.get("data") or {}).get("settings") or {}
        ns = (nxt.get("data") or {}).get("settings") or {}
        locked = ["roleViews", "roleTabs", "roleCaps", "roleSettings", "extraRoles", "unlockKey", "trialDays", "syncCloudKey"]
        for k in locked:
            if json.dumps(ps.get(k), sort_keys=True) != json.dumps(ns.get(k), sort_keys=True):
                return "Not allowed to change " + k
        return None

    def _auth(self):
        with LOCK:
            qs = parse_qs(urlparse(self.path).query)
            body = self._read_body() if self.command == "POST" else {}
            action = (body.get("action") or (qs.get("action") or [""])[0] or ("me" if self.command == "GET" else "")).strip()
            try:
                return self._auth_action(action, body)
            except Exception as err:
                return self._json({"error": str(err)}, 500)

    def _auth_action(self, action: str, body: dict):
        if action == "login":
            return self._login(body)
        if action == "logout":
            auth = read_session(self.headers)
            if auth:
                sessions = load_sessions()
                sid = auth["session"]["id"]
                if sid in sessions:
                    sessions[sid] = {**sessions[sid], "revokedAt": now_ms()}
                    save_sessions(sessions)
            return self._json({"ok": True}, 200, {"Set-Cookie": cookie_header("", 0)})
        if action == "logout-all":
            auth = read_session(self.headers)
            if not auth:
                return self._json({"error": "Not signed in"}, 401)
            sessions = load_sessions()
            for row in sessions.values():
                if row.get("user") == auth["user"]["user"] and not row.get("revokedAt"):
                    row["revokedAt"] = now_ms()
            save_sessions(sessions)
            return self._json({"ok": True}, 200, {"Set-Cookie": cookie_header("", 0)})
        if action == "me":
            auth = read_session(self.headers)
            if not auth:
                return self._json({"user": None})
            return self._json({"user": public_user(auth["user"]), "sessionId": auth["session"]["id"]})
        if action == "change-password":
            auth = read_session(self.headers)
            if not auth:
                return self._json({"error": "Not signed in"}, 401)
            nxt = str(body.get("next") or body.get("password") or "")
            if len(nxt) < 4:
                return self._json({"error": "New password must be at least 4 characters"}, 400)
            if not verify_password(str(body.get("current") or ""), auth["user"].get("passwordHash") or ""):
                return self._json({"error": "Current password is wrong"}, 403)
            users = load_users()
            users[auth["user"]["user"]] = {**users[auth["user"]["user"]], "passwordHash": hash_password(nxt)}
            save_users(users)
            return self._json({"ok": True})
        if action == "verify":
            auth = read_session(self.headers)
            if not auth:
                return self._json({"error": "Not signed in"}, 401)
            if not verify_password(str(body.get("password") or body.get("pin") or ""), auth["user"].get("passwordHash") or ""):
                return self._json({"error": "Wrong password"}, 403)
            return self._json({"ok": True, "user": public_user(auth["user"])})
        if action == "forgot":
            return self._json({"ok": True, "hint": "Ask an admin for a reset. Local server does not send email."})
        if action == "reset":
            token = str(body.get("token") or "")
            nxt = str(body.get("password") or body.get("pin") or "")
            if not token or len(nxt) < 4:
                return self._json({"error": "Token and new password required"}, 400)
            resets = blob_get("auth-resets") or {}
            row = resets.get(sha256(token))
            if not row or row.get("used") or row.get("expiresAt", 0) < now_ms():
                return self._json({"error": "Reset link expired"}, 400)
            users = load_users()
            if row["user"] not in users:
                return self._json({"error": "Account missing"}, 400)
            users[row["user"]] = {**users[row["user"]], "passwordHash": hash_password(nxt), "pending": False, "active": True}
            row["used"] = True
            save_users(users)
            blob_put("auth-resets", resets)
            return self._json({"ok": True})
        if action == "provision":
            auth = read_session(self.headers)
            if not auth:
                return self._json({"error": "Not signed in"}, 401)
            if auth["user"].get("role") != "admin":
                return self._json({"error": "Admin only"}, 403)
            name = str(body.get("name") or "").strip()
            if not name:
                return self._json({"error": "Name required"}, 400)
            staff_key = str(body.get("staffKey") or "staff-" + new_id()[:10]).lower()
            users = load_users()
            users[staff_key] = {
                "user": staff_key,
                "name": name,
                "role": str(body.get("role") or "tech"),
                "email": str(body.get("email") or ""),
                "passwordHash": "",
                "active": True,
                "pending": True,
                "createdAt": now_ms(),
                "lastLoginAt": 0,
            }
            save_users(users)
            return self._json({"ok": True, "staffKey": staff_key})
        if action == "claim":
            staff_key = str(body.get("staffKey") or "").strip().lower()
            username = re.sub(r"\s+", "", str(body.get("username") or body.get("user") or "").strip().lower())
            password = str(body.get("password") or body.get("pin") or "")
            if not staff_key or not username or len(password) < 4:
                return self._json({"error": "Username and password required"}, 400)
            users = load_users()
            pending = users.get(staff_key)
            if not pending or not pending.get("pending"):
                return self._json({"error": "This person is already set up"}, 400)
            if username in users and username != staff_key:
                return self._json({"error": "Username already exists"}, 400)
            users.pop(staff_key, None)
            users[username] = {
                **pending,
                "user": username,
                "passwordHash": hash_password(password),
                "pending": False,
                "active": True,
            }
            save_users(users)
            return self._json({"ok": True, "user": public_user(users[username])})
        if action == "deactivate":
            auth = read_session(self.headers)
            if not auth or auth["user"].get("role") != "admin":
                return self._json({"error": "Admin only"}, 403)
            username = str(body.get("username") or "").strip().lower()
            users = load_users()
            if username not in users:
                return self._json({"error": "Missing user"}, 404)
            users[username]["active"] = bool(body.get("active", False))
            save_users(users)
            return self._json({"ok": True})
        if action == "set-role":
            auth = read_session(self.headers)
            if not auth or auth["user"].get("role") != "admin":
                return self._json({"error": "Admin only"}, 403)
            username = str(body.get("username") or "").strip().lower()
            users = load_users()
            if username not in users:
                return self._json({"error": "Missing user"}, 404)
            users[username]["role"] = str(body.get("role") or users[username].get("role"))
            save_users(users)
            return self._json({"ok": True})
        if action == "sessions":
            auth = read_session(self.headers)
            if not auth:
                return self._json({"error": "Not signed in"}, 401)
            mine = [s for s in load_sessions().values() if s.get("user") == auth["user"]["user"] and not s.get("revokedAt")]
            return self._json({"sessions": mine})
        if action == "issue-reset":
            auth = read_session(self.headers)
            if not auth or auth["user"].get("role") != "admin":
                return self._json({"error": "Admin only"}, 403)
            username = str(body.get("username") or "").strip().lower()
            token = new_id() + new_id()
            resets = blob_get("auth-resets") or {}
            resets[sha256(token)] = {"user": username, "expiresAt": now_ms() + 30 * 60 * 1000, "used": False}
            blob_put("auth-resets", resets)
            return self._json({"ok": True, "resetToken": token})
        return self._json({"error": "Unknown action"}, 400)

    def _login(self, body):
        username = str(body.get("username") or body.get("user") or "").strip().lower()
        password = str(body.get("password") or body.get("pin") or "")
        if not username or not password:
            return self._json({"error": "Username and password required"}, 400)
        ensure_demo_users()
        users = load_users()
        user = users.get(username)
        if not user or user.get("pending") or not user.get("passwordHash"):
            return self._json({"error": "Invalid username or password"}, 401)
        if user.get("active") is False:
            return self._json({"error": "Account disabled"}, 403)
        if not verify_password(password, user.get("passwordHash") or ""):
            return self._json({"error": "Invalid username or password"}, 401)
        user["lastLoginAt"] = now_ms()
        users[username] = user
        save_users(users)
        token, max_age, sess = create_session(user, bool(body.get("rememberMe")), str(body.get("deviceName") or self.headers.get("User-Agent") or "device"))
        return self._json(
            {"user": public_user(user), "sessionId": sess["id"]},
            200,
            {"Set-Cookie": cookie_header(token, max_age)},
        )

    def _push(self):
        with LOCK:
            key = (self.headers.get("x-sync-key") or "").strip()
            if len(key) < 6:
                return self._json({"error": "Company key required"}, 401)
            body = self._read_body()
            action = body.get("action")
            store = blob_get("push-" + key) or {}
            user = str(body.get("user") or "")
            auth = read_session(self.headers)
            if auth:
                user = auth["user"]["user"]
            if action == "subscribe" and (body.get("subscription") or {}).get("endpoint"):
                if not user:
                    return self._json({"error": "user required"}, 400)
                lst = list(store.get(user) or [])
                endpoint = body["subscription"]["endpoint"]
                lst = [s for s in lst if s.get("endpoint") != endpoint]
                lst.append({**body["subscription"], "device": body.get("deviceName") or "", "at": now_ms()})
                store[user] = lst[-4:]
                blob_put("push-" + key, store)
                return self._json({"ok": True, "user": user})
            if action == "send":
                targets = []
                to_user = body.get("toUser")
                if to_user in ("all", "*shop*", "shop"):
                    for u, subs in store.items():
                        if u == body.get("fromUser"):
                            continue
                        targets.extend(subs or [])
                elif to_user in store:
                    targets.extend(store[to_user])
                return self._json({
                    "sent": 0,
                    "results": ["stored locally; OS web-push needs HTTPS + VAPID on Netlify"],
                    "targets": len(targets),
                })
            return self._json({"error": "Unknown action"}, 400)


def main():
    os.chdir(ROOT)
    os.makedirs(DATA, exist_ok=True)
    if not os.path.isfile(os.path.join(ROOT, "index.html")):
        sys.stderr.write("Put me_local_api.py in the SAME folder as index.html, then run it again.\n")
        sys.exit(1)
    try:
        httpd = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    except OSError as err:
        sys.stderr.write("Port %s busy: %s\n" % (PORT, err))
        sys.exit(1)
    ip = lan_ip() or "YOUR-LAN-IP"
    local = "http://127.0.0.1:%s/" % PORT
    lan = "http://%s:%s/" % (ip, PORT)
    print("=" * 60)
    print("  MaichlesEdge local API  (sync / auth / push)")
    print()
    print("  This computer:  %s" % local)
    print("  Phone Wi-Fi:    %s" % lan)
    print()
    print("  Use the SAME address on every device (the phone URL).")
    print("  Admin → Cloud sync → New key → Sync ON.")
    print("  Data folder: %s" % DATA)
    print("  Ctrl+C to stop.")
    print("=" * 60)
    try:
        webbrowser.open(lan)
    except Exception:
        pass
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        httpd.server_close()


if __name__ == "__main__":
    main()
