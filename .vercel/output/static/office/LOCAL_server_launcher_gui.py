#!/usr/bin/env python3
"""MaichlesEdge — local network server launcher.

This is the same window that made MaichlesEdge work on the shop Mac and phones.

  • MaichlesEdge unzip: pick index.html. Serves the site + me_local_api.py
    (/api/sync /api/auth /api/push). Python only.
  • Field Ledger: pick this project's package.json. Starts Node on the same
    port so payroll / GPS / timecards run on the LAN. Sign in with work email —
    Google will not work on a local address.

    python3 tools/LOCAL_server_launcher_gui.py
"""
from __future__ import annotations

import importlib.util
import os
import shutil
import signal
import socket
import subprocess
import threading
import webbrowser
from datetime import datetime
from http.server import ThreadingHTTPServer
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


def lan_ip() -> str | None:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("8.8.8.8", 80))
        return sock.getsockname()[0]
    except OSError:
        return None
    finally:
        sock.close()


def load_api(folder: str):
    here = os.path.dirname(os.path.abspath(__file__))
    for path in (os.path.join(folder, "me_local_api.py"), os.path.join(here, "me_local_api.py")):
        if os.path.isfile(path):
            spec = importlib.util.spec_from_file_location("me_local_api", path)
            if spec is None or spec.loader is None:
                continue
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            return mod, path
    return None, None


def is_maichles_site(folder: str) -> bool:
    return os.path.isfile(os.path.join(folder, "assets", "app.js")) or os.path.isfile(
        os.path.join(folder, "me_local_api.py")
    )


def find_field_ledger(start: str) -> str | None:
    cur = os.path.abspath(start)
    for _ in range(8):
        pkg = os.path.join(cur, "package.json")
        if os.path.isfile(pkg):
            try:
                raw = open(pkg, encoding="utf-8").read()
            except OSError:
                raw = ""
            if "@tanstack/react-start" in raw:
                return cur
        parent = os.path.dirname(cur)
        if parent == cur:
            break
        cur = parent
    return None


class App:
    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.root.title("MaichlesEdge Server")
        self.root.geometry("780x640")
        self.root.minsize(680, 560)
        self.root.configure(bg=BG)
        self.root.option_add("*Font", "Helvetica 12")

        self.server: ThreadingHTTPServer | None = None
        self.proc: subprocess.Popen | None = None
        self.path = tk.StringVar()
        self.port = tk.StringVar(value="8080")
        self.status = tk.StringVar(value="Idle")
        self.local_url = tk.StringVar(value="—")
        self.lan_url = tk.StringVar(value="—")

        self._build()
        self.root.protocol("WM_DELETE_WINDOW", self.close)
        self.log("Ready. MaichlesEdge: pick unzipped index.html. Field Ledger: pick package.json.")

    def _build(self) -> None:
        head = tk.Frame(self.root, bg=BG)
        head.pack(fill="x", padx=22, pady=(18, 8))
        tk.Label(head, text="MaichlesEdge", fg=ACCENT2, bg=BG, font=("Helvetica", 11, "bold")).pack(anchor="w")
        tk.Label(head, text="Local network server", fg=FG, bg=BG, font=("Helvetica", 22, "bold")).pack(anchor="w")
        tk.Label(
            head,
            text="Same window as before. Unzipped MaichlesEdge, or Field Ledger on this Mac — phones use the Wi‑Fi URL.",
            fg=MUTED,
            bg=BG,
            font=("Helvetica", 11),
        ).pack(anchor="w", pady=(4, 0))

        card = tk.Frame(self.root, bg=PANEL, highlightbackground=LINE, highlightthickness=1)
        card.pack(fill="x", padx=22, pady=8)

        inner = tk.Frame(card, bg=PANEL)
        inner.pack(fill="x", padx=16, pady=14)

        tk.Label(inner, text="SITE FILE", fg=MUTED, bg=PANEL, font=("Helvetica", 9, "bold")).pack(anchor="w")
        row = tk.Frame(inner, bg=PANEL)
        row.pack(fill="x", pady=(6, 12))
        entry = tk.Entry(
            row,
            textvariable=self.path,
            bg=PANEL2,
            fg=FG,
            insertbackground=FG,
            relief="flat",
            highlightthickness=1,
            highlightbackground=LINE,
            highlightcolor=ACCENT,
        )
        entry.pack(side="left", fill="x", expand=True, ipady=8, padx=(0, 8))
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
        tk.Label(port_row, text="Listens on 0.0.0.0  ·  leave 8080 for Field Ledger sign-in", fg=MUTED, bg=PANEL, font=("Helvetica", 10)).pack(
            side="left", padx=12
        )

        actions = tk.Frame(self.root, bg=BG)
        actions.pack(fill="x", padx=22, pady=10)
        self.start_btn = self._btn(actions, "  Start server  ", self.start, primary=True)
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
        self._url_row(urls, "This computer", self.local_url)
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

    def _url_row(self, parent: tk.Frame, label: str, var: tk.StringVar) -> None:
        row = tk.Frame(parent, bg=BG)
        row.pack(fill="x", pady=3)
        tk.Label(row, text=label, fg=MUTED, bg=BG, font=("Helvetica", 10), width=26, anchor="w").pack(side="left")
        tk.Label(row, textvariable=var, fg=ACCENT2, bg=BG, font=("Menlo", 12)).pack(side="left")

    def _btn(self, parent: tk.Misc, text: str, cmd, primary: bool = False, danger: bool = False) -> tk.Label:
        # Labels, not tk.Button — macOS Aqua ignores Button fg/bg and the text vanishes.
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
        btn.configure(fg="#ffffff" if on else "#8aa0b3", bg=btn._bg if on else "#24303c")  # type: ignore[attr-defined]
        btn.configure(cursor="hand2" if on else "arrow")

    def log(self, message: str) -> None:
        stamp = datetime.now().strftime("%H:%M:%S")
        self.output.insert("end", f"[{stamp}]  {message}\n")
        self.output.see("end")

    def select_file(self) -> None:
        path = filedialog.askopenfilename(
            title="MaichlesEdge index.html  or  Field Ledger package.json",
            filetypes=[
                ("Site", "*.html *.htm package.json"),
                ("HTML files", "*.html *.htm"),
                ("Field Ledger", "package.json"),
                ("All files", "*.*"),
            ],
        )
        if path:
            self.path.set(path)
            self.log(f"Selected {path}")
            self.log(f"Root {os.path.dirname(path)}")

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

    def start(self) -> None:
        if self.is_running():
            return
        file_path = self.path.get().strip()
        if not os.path.isfile(file_path):
            messagebox.showerror("File", "Select unzipped MaichlesEdge index.html, or Field Ledger package.json.")
            return
        port = self.valid_port()
        if port is None:
            return

        folder = os.path.dirname(os.path.abspath(file_path))
        filename = os.path.basename(file_path)
        ledger = find_field_ledger(folder)

        if is_maichles_site(folder):
            self.start_maichles(folder, filename, port)
            return
        if ledger:
            self.start_ledger(ledger, port)
            return
        if filename.lower() in ("index.html", "index.htm"):
            self.start_maichles(folder, filename, port)
            return
        messagebox.showerror(
            "Site",
            "That file is not a MaichlesEdge unzip (needs assets/app.js or me_local_api.py)\n"
            "and not a Field Ledger project (needs package.json with TanStack Start).",
        )

    def start_maichles(self, folder: str, filename: str, port: int) -> None:
        app = self
        api, api_path = load_api(folder)
        if not api:
            self.log("me_local_api.py not found next to index.html or this launcher.")
            messagebox.showerror(
                "Sync API missing",
                "Copy me_local_api.py into the same folder as index.html,\nthen Start again.\n\nThe GUI file server cannot handle PUT /api/sync by itself.",
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
            self.log(f"Could not bind 0.0.0.0:{port} — {err}")
            messagebox.showerror("Start failed", f"Port {port} may already be in use.\n\n{err}")
            return

        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        ip = lan_ip() or "YOUR-LAN-IP"
        self.local_url.set(f"http://127.0.0.1:{port}/{filename}")
        self.lan_url.set(f"http://{ip}:{port}/{filename}")
        self.status.set(f"MaichlesEdge on the local network  ·  port {port}")
        self.dot.configure(fg=OK)
        self.log("Sync API on  /api/sync  /api/auth  /api/push")
        self.log(f"Loaded {api_path}")
        self.log(f"Data   {api.DATA}")
        self.log(f"This computer  {self.local_url.get()}")
        self.log(f"Phone / iPad   {self.lan_url.get()}")
        self.log("Use the phone URL on every device. Admin → Cloud sync → New key → ON.")
        self.update_controls()

    def start_ledger(self, root: str, port: int) -> None:
        node = shutil.which("node")
        if not node:
            messagebox.showerror(
                "Node.js",
                "Field Ledger needs Node.js on this Mac.\n\n"
                "brew install node\n\n"
                "MaichlesEdge unzip still runs with Python only — pick that index.html instead.",
            )
            return
        wrapper = os.path.join(root, "scripts", "with-app-env.mjs")
        if not os.path.isfile(wrapper):
            messagebox.showerror("Field Ledger", "scripts/with-app-env.mjs missing — open the Field Ledger project folder.")
            return
        ip = lan_ip() or "127.0.0.1"
        env = os.environ.copy()
        env["BETTER_AUTH_URL"] = f"http://{ip}:{port}"
        built = os.path.isdir(os.path.join(root, "dist"))
        mode = "preview" if built else "dev"
        cmd = [node, wrapper, "vite", mode, "--host", "0.0.0.0", "--port", str(port)]
        self.log(f"Field Ledger  {mode}  in {root}")
        self.log("Google will not work on this address. Use work email + password.")

        def boot() -> None:
            try:
                if not os.path.isdir(os.path.join(root, "node_modules")):
                    self.root.after(0, self.log, "Installing npm packages (first run)…")
                    subprocess.check_call(["npm", "install"], cwd=root)
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
        self.local_url.set(f"http://127.0.0.1:{port}/")
        self.lan_url.set(f"http://{ip}:{port}/")
        self.status.set(f"Field Ledger on the local network  ·  port {port}")
        self.dot.configure(fg=OK)
        self.log(f"This computer  {self.local_url.get()}")
        self.log(f"Phone / iPad   {self.lan_url.get()}")
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
        if self.is_running():
            webbrowser.open(self.local_url.get())

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
        self._enable(self.open_btn, running)
        self._enable(self.copy_btn, running)

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
    root = tk.Tk()
    App(root)
    root.mainloop()
