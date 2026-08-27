#!/usr/bin/env python3
"""Maichle's Edge — shop Mac start window.

Drop this file in the apps folder (the one that contains workspace).
It finds Field Ledger, the phone code book, and Node even when opened from Finder.

    python3 LOCAL_server_launcher_gui.py
"""
from __future__ import annotations

import importlib.util
import os
import shutil
import signal
import socket
import subprocess
import sys
import threading
import webbrowser
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from tkinter import filedialog, messagebox
import tkinter as tk

BG = "#0e141b"
PANEL = "#151d27"
PANEL2 = "#1c2733"
FG = "#e8eef4"
MUTED = "#8aa0b3"
ACCENT = "#3b8fd4"
ACCENT2 = "#4a9de0"
OK = "#3d9a6a"
STOP = "#d45b5b"
LINE = "#2a3a4a"

NODE_DIRS = (
    "/opt/homebrew/bin",
    "/usr/local/bin",
    "/opt/homebrew/opt/node/bin",
    "/usr/local/opt/node/bin",
)


def here_dir() -> str:
    return os.path.dirname(os.path.abspath(__file__))


def lan_ip() -> str | None:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("8.8.8.8", 80))
        return sock.getsockname()[0]
    except OSError:
        return None
    finally:
        sock.close()


def port_open(host: str, port: int) -> bool:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(0.35)
    try:
        sock.connect((host, port))
        return True
    except OSError:
        return False
    finally:
        sock.close()


def ensure_mac_path() -> None:
    """Finder-launched Python has no Homebrew/nvm PATH. Put Node where npm can see it."""
    parts = os.environ.get("PATH", "").split(":")
    extra: list[str] = []
    nvm = os.path.expanduser("~/.nvm/versions/node")
    if os.path.isdir(nvm):
        versions = sorted(os.listdir(nvm), reverse=True)
        for ver in versions:
            binp = os.path.join(nvm, ver, "bin")
            if os.path.isdir(binp):
                extra.append(binp)
                break
    fnm = os.path.expanduser("~/.fnm/node-versions")
    if os.path.isdir(fnm):
        for ver in sorted(os.listdir(fnm), reverse=True):
            binp = os.path.join(fnm, ver, "installation", "bin")
            if os.path.isdir(binp):
                extra.append(binp)
                break
    extra.extend(d for d in NODE_DIRS if os.path.isdir(d))
    for d in reversed(extra):
        if d not in parts:
            parts.insert(0, d)
    os.environ["PATH"] = ":".join(p for p in parts if p)


def find_node() -> str | None:
    ensure_mac_path()
    found = shutil.which("node")
    if found:
        return found
    for d in NODE_DIRS:
        cand = os.path.join(d, "node")
        if os.path.isfile(cand) and os.access(cand, os.X_OK):
            return cand
    return None


def find_npm(node: str) -> str | None:
    bindir = os.path.dirname(node)
    cand = os.path.join(bindir, "npm")
    if os.path.isfile(cand):
        return cand
    return shutil.which("npm")


def is_field_ledger(folder: str) -> bool:
    pkg = os.path.join(folder, "package.json")
    if not os.path.isfile(pkg):
        return False
    try:
        raw = open(pkg, encoding="utf-8").read()
    except OSError:
        return False
    return "@tanstack/react-start" in raw and os.path.isdir(os.path.join(folder, "src"))


def find_field_ledger(start: str) -> str | None:
    cur = os.path.abspath(start)
    seen: set[str] = set()
    queue = [cur, os.path.join(cur, "workspace"), os.path.dirname(cur)]
    for folder in queue:
        folder = os.path.abspath(folder)
        if folder in seen:
            continue
        seen.add(folder)
        if is_field_ledger(folder):
            return folder
    cur = os.path.abspath(start)
    for _ in range(8):
        if is_field_ledger(cur):
            return cur
        parent = os.path.dirname(cur)
        if parent == cur:
            break
        cur = parent
    return None


def find_code_book(start: str, ledger: str | None) -> str | None:
    names = ("Maichles-Code-Book.html", "Maichles-Code-Book (3).html")
    folders = []
    if ledger:
        folders += [
            os.path.join(ledger, "public"),
            os.path.join(ledger, "public", "office"),
            ledger,
        ]
    folders += [start, os.path.join(start, "public"), os.path.join(start, "workspace", "public")]
    for folder in folders:
        for name in names:
            path = os.path.join(folder, name)
            if os.path.isfile(path):
                return path
    return None


def is_maichles_site(folder: str) -> bool:
    return os.path.isfile(os.path.join(folder, "assets", "app.js")) or os.path.isfile(
        os.path.join(folder, "me_local_api.py")
    )


def load_api(folder: str):
    search = [os.path.join(folder, "me_local_api.py"), os.path.join(here_dir(), "me_local_api.py")]
    for path in search:
        if not os.path.isfile(path):
            continue
        spec = importlib.util.spec_from_file_location("me_local_api", path)
        if spec is None or spec.loader is None:
            continue
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod, path
    return None, None


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        return


class App:
    def __init__(self, root: tk.Tk) -> None:
        ensure_mac_path()
        self.root = root
        self.root.title("Maichle's Edge — Shop Mac")
        self.root.geometry("820x700")
        self.root.minsize(700, 600)
        self.root.configure(bg=BG)
        self.root.option_add("*Font", "Helvetica 12")

        self.server: ThreadingHTTPServer | None = None
        self.proc: subprocess.Popen | None = None
        self.mode = tk.StringVar(value="ledger")
        self.path = tk.StringVar()
        self.port = tk.StringVar(value="8080")
        self.status = tk.StringVar(value="Idle")
        self.local_url = tk.StringVar(value="—")
        self.lan_url = tk.StringVar(value="—")
        self.detected = tk.StringVar(value="")

        self.ledger = find_field_ledger(here_dir())
        self.codebook = find_code_book(here_dir(), self.ledger)
        if self.ledger:
            self.path.set(os.path.join(self.ledger, "package.json"))
            self.mode.set("ledger")
        elif self.codebook:
            self.path.set(self.codebook)
            self.mode.set("book")

        self._build()
        self.root.protocol("WM_DELETE_WINDOW", self.close)
        self._announce()

    def _announce(self) -> None:
        self.log("This window starts the shop apps on this Mac and the phones on the same Wi‑Fi.")
        self.log("Keep:  workspace  = Field Ledger (office).  MaichlesEdge = old site.  This .py file.")
        self.log("Ignore: field-ledger-netlify, Service_Catalog_Netlify, old, zips, python_sync folders.")
        if self.ledger:
            self.log(f"Found Field Ledger  {self.ledger}")
            scripts = self.read_scripts(self.ledger)
            self.log("Detected Vite / Node project.")
            if scripts:
                self.log("Scripts: " + ", ".join(scripts))
            self.log('Click Start — that runs "dev" (Field Ledger). Do not pick index.html for this one.')
            self.detected.set(f"Field Ledger found — {self.ledger}")
        else:
            self.log("Field Ledger (workspace folder with package.json) not next to this file.")
            self.detected.set("No Field Ledger next to this file — Browse to workspace/package.json")
        if self.codebook:
            self.log(f"Found phone code book  {self.codebook}")
        node = find_node()
        if node:
            self.log(f"Found Node  {node}")
        else:
            self.log("Node.js not on PATH. Field Ledger needs it. Code book does not.")
        self.log("Ready. MaichlesEdge: pick unzipped index.html. Field Ledger: pick package.json.")

    def _build(self) -> None:
        head = tk.Frame(self.root, bg=BG)
        head.pack(fill="x", padx=22, pady=(18, 8))
        tk.Label(head, text="MAICHLE'S EDGE", fg=ACCENT2, bg=BG, font=("Helvetica", 11, "bold")).pack(anchor="w")
        tk.Label(head, text="Shop Mac start", fg=FG, bg=BG, font=("Helvetica", 22, "bold")).pack(anchor="w")
        tk.Label(
            head,
            text="One window. Field Ledger is the office app. The code book is the one-file phone book. Same Wi‑Fi URL for phones.",
            fg=MUTED,
            bg=BG,
            font=("Helvetica", 11),
            wraplength=760,
            justify="left",
        ).pack(anchor="w", pady=(4, 0))
        tk.Label(head, textvariable=self.detected, fg=ACCENT2, bg=BG, font=("Helvetica", 11)).pack(anchor="w", pady=(8, 0))

        card = tk.Frame(self.root, bg=PANEL, highlightbackground=LINE, highlightthickness=1)
        card.pack(fill="x", padx=22, pady=8)
        inner = tk.Frame(card, bg=PANEL)
        inner.pack(fill="x", padx=16, pady=14)

        tk.Label(inner, text="WHAT TO START", fg=MUTED, bg=PANEL, font=("Helvetica", 9, "bold")).pack(anchor="w")
        modes = tk.Frame(inner, bg=PANEL)
        modes.pack(fill="x", pady=(6, 12))
        for value, label in (
            ("ledger", "Field Ledger  (office)"),
            ("book", "Phone code book  (one file)"),
            ("classic", "Classic MaichlesEdge unzip"),
        ):
            tk.Radiobutton(
                modes,
                text=label,
                variable=self.mode,
                value=value,
                command=self._mode_changed,
                bg=PANEL,
                fg=FG,
                selectcolor=PANEL2,
                activebackground=PANEL,
                activeforeground=FG,
                highlightthickness=0,
                font=("Helvetica", 12),
            ).pack(anchor="w")

        tk.Label(inner, text="FILE  (auto-filled when found)", fg=MUTED, bg=PANEL, font=("Helvetica", 9, "bold")).pack(anchor="w")
        row = tk.Frame(inner, bg=PANEL)
        row.pack(fill="x", pady=(6, 12))
        tk.Entry(
            row,
            textvariable=self.path,
            bg=PANEL2,
            fg=FG,
            insertbackground=FG,
            relief="flat",
            highlightthickness=1,
            highlightbackground=LINE,
            highlightcolor=ACCENT,
        ).pack(side="left", fill="x", expand=True, ipady=8, padx=(0, 8))
        self._btn(row, "Browse", self.select_file).pack(side="right")

        tk.Label(inner, text="PORT", fg=MUTED, bg=PANEL, font=("Helvetica", 9, "bold")).pack(anchor="w")
        port_row = tk.Frame(inner, bg=PANEL)
        port_row.pack(fill="x", pady=(6, 0))
        tk.Entry(
            port_row,
            textvariable=self.port,
            width=10,
            bg=PANEL2,
            fg=FG,
            insertbackground=FG,
            relief="flat",
            highlightthickness=1,
            highlightbackground=LINE,
            highlightcolor=ACCENT,
            justify="center",
        ).pack(side="left", ipady=8)
        tk.Label(
            port_row,
            text="8080  ·  if Terminal already started Field Ledger, just Open",
            fg=MUTED,
            bg=PANEL,
            font=("Helvetica", 10),
        ).pack(side="left", padx=12)

        actions = tk.Frame(self.root, bg=BG)
        actions.pack(fill="x", padx=22, pady=10)
        self.start_btn = self._btn(actions, "  Start  ", self.start, primary=True)
        self.start_btn.pack(side="left")
        self.stop_btn = self._btn(actions, "  Stop  ", self.stop, danger=True)
        self.stop_btn.pack(side="left", padx=8)
        self.open_btn = self._btn(actions, "  Open here  ", self.open_local)
        self.open_btn.pack(side="left")
        self.copy_btn = self._btn(actions, "  Copy phone URL  ", self.copy_lan)
        self.copy_btn.pack(side="left", padx=8)

        stats = tk.Frame(self.root, bg=PANEL, highlightbackground=LINE, highlightthickness=1)
        stats.pack(fill="x", padx=22, pady=4)
        s_in = tk.Frame(stats, bg=PANEL)
        s_in.pack(fill="x", padx=16, pady=12)
        self.dot = tk.Label(s_in, text="●", fg=MUTED, bg=PANEL, font=("Helvetica", 14))
        self.dot.pack(side="left", padx=(0, 8))
        tk.Label(s_in, textvariable=self.status, fg=FG, bg=PANEL, font=("Helvetica", 12, "bold")).pack(side="left")

        urls = tk.Frame(self.root, bg=BG)
        urls.pack(fill="x", padx=22, pady=8)
        self._url_row(urls, "This Mac", self.local_url)
        self._url_row(urls, "Phone / iPad  (same Wi‑Fi)", self.lan_url)

        term = tk.Frame(self.root, bg=PANEL, highlightbackground=LINE, highlightthickness=1)
        term.pack(fill="both", expand=True, padx=22, pady=(4, 18))
        tk.Label(term, text="LOG", fg=MUTED, bg=PANEL, font=("Helvetica", 9, "bold")).pack(anchor="w", padx=14, pady=(10, 0))
        self.output = tk.Text(
            term,
            bg="#0b1016",
            fg="#c5d6e5",
            insertbackground=FG,
            font=("Menlo", 11),
            relief="flat",
            wrap="word",
            padx=12,
            pady=10,
            highlightthickness=0,
            borderwidth=0,
        )
        self.output.pack(fill="both", expand=True, padx=8, pady=8)
        self.update_controls()

    def _mode_changed(self) -> None:
        mode = self.mode.get()
        if mode == "ledger" and self.ledger:
            self.path.set(os.path.join(self.ledger, "package.json"))
        elif mode == "book" and self.codebook:
            self.path.set(self.codebook)
        elif mode == "classic":
            if not is_maichles_site(os.path.dirname(self.path.get() or "")):
                self.path.set("")

    def _url_row(self, parent: tk.Frame, label: str, var: tk.StringVar) -> None:
        row = tk.Frame(parent, bg=BG)
        row.pack(fill="x", pady=3)
        tk.Label(row, text=label, fg=MUTED, bg=BG, font=("Helvetica", 10), width=28, anchor="w").pack(side="left")
        tk.Label(row, textvariable=var, fg=ACCENT2, bg=BG, font=("Menlo", 12)).pack(side="left")

    def _btn(self, parent: tk.Misc, text: str, cmd, primary: bool = False, danger: bool = False) -> tk.Label:
        bg = "#1f6fb8" if primary else ("#b83a3a" if danger else "#2e4a63")
        btn = tk.Label(
            parent,
            text=text.strip(),
            bg=bg,
            fg="#ffffff",
            font=("Helvetica", 13, "bold"),
            cursor="hand2",
            padx=16,
            pady=10,
            highlightthickness=0,
            bd=0,
        )
        btn._cmd = cmd  # type: ignore[attr-defined]
        btn._bg = bg  # type: ignore[attr-defined]
        btn._on = True  # type: ignore[attr-defined]
        btn.bind("<Button-1>", lambda _e, b=btn: b._cmd() if b._on else None)
        btn.bind("<Enter>", lambda _e, b=btn: b.configure(bg="#3d8fd4" if b._on else b.cget("bg")))
        btn.bind("<Leave>", lambda _e, b=btn: b.configure(bg=b._bg if b._on else "#24303c"))
        return btn

    def _enable(self, btn: tk.Label, on: bool) -> None:
        btn._on = on  # type: ignore[attr-defined]
        btn.configure(fg="#ffffff" if on else "#8aa0b3", bg=btn._bg if on else "#24303c")
        btn.configure(cursor="hand2" if on else "arrow")

    def log(self, message: str) -> None:
        stamp = datetime.now().strftime("%H:%M:%S")
        self.output.insert("end", f"[{stamp}]  {message}\n")
        self.output.see("end")

    def read_scripts(self, folder: str) -> list[str]:
        pkg = os.path.join(folder, "package.json")
        try:
            import json
            data = json.loads(open(pkg, encoding="utf-8").read())
            return list((data.get("scripts") or {}).keys())
        except Exception:
            return []

    def select_file(self) -> None:
        mode = self.mode.get()
        if mode == "ledger":
            title, types = "Field Ledger package.json inside workspace", [("Field Ledger", "package.json"), ("All", "*.*")]
        elif mode == "book":
            title, types = "Phone code book HTML", [("HTML", "*.html *.htm"), ("All", "*.*")]
        else:
            title, types = "Classic MaichlesEdge index.html", [("HTML", "*.html *.htm"), ("All", "*.*")]
        path = filedialog.askopenfilename(title=title, filetypes=types)
        if not path:
            return
        self.path.set(path)
        folder = os.path.dirname(path)
        self.log(f"Selected {path}")
        self.log(f"Root {folder}")
        ledger = find_field_ledger(folder)
        if ledger:
            self.ledger = ledger
            self.mode.set("ledger")
            self.path.set(os.path.join(ledger, "package.json"))
            scripts = self.read_scripts(ledger)
            self.log("Detected Vite / Node project.")
            if scripts:
                self.log("Scripts: " + ", ".join(scripts))
            self.log('This is Field Ledger. Click Start — it runs the "dev" script.')
            self.detected.set(f"Field Ledger found — {ledger}")
            return
        if os.path.basename(path).lower().startswith("maichles-code-book"):
            self.codebook = path
            self.mode.set("book")
            return
        if is_maichles_site(folder):
            self.mode.set("classic")
            self.log("Classic MaichlesEdge unzip. Click Start to serve it on the local network.")


    def valid_port(self) -> int | None:
        try:
            port = int(self.port.get().strip())
            if 1 <= port <= 65535:
                return port
        except ValueError:
            pass
        messagebox.showerror("Port", "Enter a port from 1 to 65535.")
        return None

    def is_running(self) -> bool:
        if self.server is not None:
            return True
        return self.proc is not None and self.proc.poll() is None

    def mark_urls(self, path: str, port: int) -> None:
        ip = lan_ip() or "YOUR-LAN-IP"
        suffix = path if path.startswith("/") else ("/" + path if path else "/")
        self.local_url.set(f"http://127.0.0.1:{port}{suffix}")
        self.lan_url.set(f"http://{ip}:{port}{suffix}")

    def attach_existing(self, path: str, port: int, label: str) -> None:
        self.mark_urls(path, port)
        self.status.set(f"Already running  ·  {label}")
        self.dot.configure(fg=OK)
        self.log(f"{label} is already on this port. Opening it instead of starting a second copy.")
        self.log(f"This Mac     {self.local_url.get()}")
        self.log(f"Phone/iPad   {self.lan_url.get()}")
        self.update_controls()
        self.open_local()

    def start(self) -> None:
        if self.is_running():
            return
        port = self.valid_port()
        if port is None:
            return
        mode = self.mode.get()
        file_path = self.path.get().strip()

        if mode == "ledger":
            folder = os.path.dirname(os.path.abspath(file_path)) if file_path else ""
            ledger = find_field_ledger(folder or here_dir()) or self.ledger
            if not ledger:
                messagebox.showerror(
                    "Field Ledger",
                    "Put this launcher in the apps folder (next to workspace),\n"
                    "or Browse to workspace/package.json.",
                )
                return
            if port_open("127.0.0.1", port):
                self.attach_existing("/", port, "Field Ledger")
                return
            self.start_ledger(ledger, port)
            return

        if mode == "book":
            book = file_path if os.path.isfile(file_path) else self.codebook
            if not book or not os.path.isfile(book):
                messagebox.showerror("Code book", "Browse to Maichles-Code-Book.html (one file).")
                return
            if port_open("127.0.0.1", port):
                self.attach_existing("/" + os.path.basename(book), port, "Code book")
                return
            self.start_book(book, port)
            return

        if not os.path.isfile(file_path):
            messagebox.showerror("File", "Browse to the unzipped MaichlesEdge index.html.")
            return
        folder = os.path.dirname(os.path.abspath(file_path))
        if port_open("127.0.0.1", port):
            self.attach_existing("/" + os.path.basename(file_path), port, "MaichlesEdge")
            return
        self.start_maichles(folder, os.path.basename(file_path), port)

    def start_book(self, book: str, port: int) -> None:
        folder = os.path.dirname(os.path.abspath(book))
        name = os.path.basename(book)
        app = self

        class Handler(QuietHandler):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, directory=folder, **kwargs)

            def log_message(self, fmt: str, *args) -> None:
                app.root.after(0, app.log, fmt % args)

        try:
            self.server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
            self.server.allow_reuse_address = True
        except OSError as err:
            self.server = None
            self.log(f"Could not bind port {port} — {err}")
            messagebox.showerror("Start failed", f"Port {port} is in use.\n\n{err}")
            return
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.mark_urls("/" + name, port)
        self.status.set(f"Phone code book  ·  port {port}")
        self.dot.configure(fg=OK)
        self.log("One HTML file. No extra CSS/JS folders. Phones open the Wi‑Fi URL, then Add to Home Screen.")
        self.log(f"This Mac     {self.local_url.get()}")
        self.log(f"Phone/iPad   {self.lan_url.get()}")
        self.update_controls()

    def start_maichles(self, folder: str, filename: str, port: int) -> None:
        app = self
        api, api_path = load_api(folder)
        if not api:
            self.log("me_local_api.py not found next to index.html or this launcher.")
            messagebox.showerror(
                "Sync API missing",
                "Copy me_local_api.py into the same folder as this launcher\n"
                "(or next to index.html), then Start again.",
            )
            return
        api.ROOT = folder
        api.DATA = os.path.join(folder, "me-data")
        os.makedirs(api.DATA, exist_ok=True)

        class Handler(api.Handler):
            def log_message(self, fmt: str, *args) -> None:
                app.root.after(0, app.log, fmt % args)

        try:
            self.server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
            self.server.allow_reuse_address = True
        except OSError as err:
            self.server = None
            self.log(f"Could not bind port {port} — {err}")
            messagebox.showerror("Start failed", f"Port {port} is in use.\n\n{err}")
            return
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.mark_urls("/" + filename, port)
        self.status.set(f"Classic MaichlesEdge  ·  port {port}")
        self.dot.configure(fg=OK)
        self.log("Sync API on  /api/sync  /api/auth  /api/push")
        self.log(f"Loaded {api_path}")
        self.log(f"This Mac     {self.local_url.get()}")
        self.log(f"Phone/iPad   {self.lan_url.get()}")
        self.update_controls()

    def start_ledger(self, root: str, port: int) -> None:
        node = find_node()
        if not node:
            messagebox.showerror(
                "Node.js",
                "Field Ledger needs Node on this Mac.\n\n"
                "Install Node, then open this window again.\n\n"
                "The phone code book does not need Node — pick that instead.",
            )
            return
        npm = find_npm(node)
        wrapper = os.path.join(root, "scripts", "with-app-env.mjs")
        if not os.path.isfile(wrapper):
            messagebox.showerror("Field Ledger", f"Missing {wrapper}\nOpen the workspace folder, not a zip.")
            return
        ip = lan_ip() or "127.0.0.1"
        env = os.environ.copy()
        env["BETTER_AUTH_URL"] = f"http://{ip}:{port}"
        env["PATH"] = os.path.dirname(node) + ":" + env.get("PATH", "")
        cmd = [node, wrapper, "vite", "dev", "--host", "0.0.0.0", "--port", str(port)]
        self.log(f"Field Ledger  in  {root}")
        self.log("Google sign-in will not work on a local address. Use work email + password.")

        def boot() -> None:
            try:
                if not os.path.isdir(os.path.join(root, "node_modules")):
                    self.root.after(0, self.log, "Installing packages (first run, a few minutes)…")
                    if not npm:
                        raise RuntimeError("npm not found next to node")
                    subprocess.check_call([npm, "install"], cwd=root, env=env)
                proc = subprocess.Popen(
                    cmd,
                    cwd=root,
                    env=env,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    start_new_session=True,
                )
                self.proc = proc
                assert proc.stdout
                for line in proc.stdout:
                    text = line.rstrip()
                    if text:
                        self.root.after(0, self.log, text)
                self.root.after(0, self._proc_exited)
            except Exception as err:
                self.root.after(0, self.log, f"Field Ledger failed: {err}")
                self.root.after(0, self.stopped)

        threading.Thread(target=boot, daemon=True).start()
        self.mark_urls("/", port)
        self.status.set(f"Field Ledger  ·  port {port}")
        self.dot.configure(fg=OK)
        self.log(f"This Mac     {self.local_url.get()}")
        self.log(f"Phone/iPad   {self.lan_url.get()}")
        self.log("Code book on the same server: add /Maichles-Code-Book.html to that URL.")
        self.update_controls()

    def _proc_exited(self) -> None:
        if self.proc is not None and self.proc.poll() is not None:
            self.proc = None
            self.stopped()

    def stop(self) -> None:
        if not self.is_running():
            return
        self.log("Stopping…")
        proc = self.proc
        self.proc = None
        server = self.server
        self.server = None

        def shutdown() -> None:
            if proc and proc.poll() is None:
                try:
                    os.killpg(proc.pid, signal.SIGTERM)
                except (OSError, ProcessLookupError):
                    try:
                        proc.terminate()
                    except OSError:
                        pass
            if server:
                try:
                    server.shutdown()
                    server.server_close()
                except OSError:
                    pass
            self.root.after(0, self.stopped)

        threading.Thread(target=shutdown, daemon=True).start()

    def stopped(self) -> None:
        self.status.set("Idle")
        self.local_url.set("—")
        self.lan_url.set("—")
        self.dot.configure(fg=MUTED)
        self.log("Stopped")
        self.update_controls()

    def open_local(self) -> None:
        url = self.local_url.get()
        if url and url != "—":
            webbrowser.open(url)

    def copy_lan(self) -> None:
        url = self.lan_url.get()
        if url == "—":
            return
        self.root.clipboard_clear()
        self.root.clipboard_append(url)
        self.log(f"Copied {url}")

    def update_controls(self) -> None:
        running = self.is_running()
        self._enable(self.start_btn, not running)
        self._enable(self.stop_btn, running)
        self._enable(self.open_btn, running or self.local_url.get() not in ("", "—"))
        self._enable(self.copy_btn, running or self.lan_url.get() not in ("", "—"))

    def close(self) -> None:
        if self.is_running():
            try:
                if self.proc and self.proc.poll() is None:
                    os.killpg(self.proc.pid, signal.SIGTERM)
            except (OSError, ProcessLookupError):
                pass
            if self.server:
                try:
                    self.server.shutdown()
                    self.server.server_close()
                except OSError:
                    pass
        self.root.destroy()


if __name__ == "__main__":
    if sys.platform == "darwin":
        os.environ.setdefault("TK_SILENCE_DEPRECATION", "1")
    root = tk.Tk()
    App(root)
    root.mainloop()
