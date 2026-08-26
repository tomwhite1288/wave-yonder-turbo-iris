#!/usr/bin/env python3
"""Opens the MaichlesEdge office launcher (your original GUI).

    python3 tools/office_gui.py
    python3 tools/LOCAL_server_launcher_gui.py

Browse to the unzipped MaichlesEdge index.html, then Start.
me_local_api.py must sit next to that index.html, or next to this launcher.
"""
from __future__ import annotations

import runpy
from pathlib import Path

if __name__ == "__main__":
    runpy.run_path(str(Path(__file__).with_name("LOCAL_server_launcher_gui.py")), run_name="__main__")
