#!/usr/bin/env python3
"""Convert QuickBooks Service.csv + Plumbing.xlsx into Field Ledger import CSVs.

Usage:
  python3 tools/convert_pricebooks.py \\
    --service attachments/Service.csv \\
    --plumbing attachments/Plumbing.xlsx \\
    --out public/samples
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

LABOR_RATE = 185.0
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
FIELDS = [
    "book",
    "code",
    "description",
    "category",
    "trade",
    "hours",
    "parts_allowance",
    "list_price",
    "labor_value",
    "active",
    "notes",
]
HVAC_PREFIX = {
    "HA": "HVAC-Refrigerant",
    "HB": "HVAC-Electrical",
    "HT": "HVAC-Air/Water",
    "HZ": "HVAC-Comfort",
    "RR": "HVAC-Protection",
}
PLUMB_PREFIX = {
    "PA": "Drain-Cleaning",
    "PB": "Pressure",
    "PC": "Fixtures",
    "PD": "Water Removal / Circulation",
    "PE": "Water Heaters",
    "PF": "Gas",
    "PG": "Disposals",
    "PH": "Hose / Laundry",
    "PO": "Well / Delivery",
    "PP": "Freeze Protection",
    "PQ": "Backflow / Contamination",
    "PR": "Sewer / Underground",
}


def split_csv_line(line: str) -> list[str]:
    out: list[str] = []
    cur = ""
    inq = False
    i = 0
    while i < len(line):
        ch = line[i]
        if inq:
            if ch == '"':
                if i + 1 < len(line) and line[i + 1] == '"':
                    cur += '"'
                    i += 1
                else:
                    inq = False
            else:
                cur += ch
        elif ch == '"':
            inq = True
        elif ch == ",":
            out.append(cur)
            cur = ""
        else:
            cur += ch
        i += 1
    out.append(cur)
    return out


def parse_service_csv(path: Path) -> list[dict[str, str]]:
    text = path.read_text(encoding="utf-8-sig").replace("\r\n", "\n").replace("\r", "\n")
    lines = [l for l in text.split("\n") if l.strip()]
    headers = [h.strip() for h in split_csv_line(lines[0])]
    rows = []
    for line in lines[1:]:
        cells = split_csv_line(line)
        rows.append({headers[i]: (cells[i] if i < len(cells) else "") for i in range(len(headers))})
    return rows


def parse_xlsx(path: Path) -> list[dict[str, str]]:
    z = zipfile.ZipFile(path)
    ss = ET.fromstring(z.read("xl/sharedStrings.xml"))
    strings: list[str] = []
    for si in ss.findall("m:si", NS):
        texts = list(si.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t"))
        strings.append("".join(t.text or "" for t in texts))
    sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
    raw_rows = []
    for row in sheet.findall("m:sheetData/m:row", NS):
        cells: dict[str, str] = {}
        for c in row.findall("m:c", NS):
            ref = c.get("r") or ""
            col = "".join(ch for ch in ref if ch.isalpha())
            v = c.find("m:v", NS)
            if v is None:
                continue
            val = v.text or ""
            if c.get("t") == "s":
                val = strings[int(val)]
            cells[col] = val
        raw_rows.append(cells)
    header = raw_rows[0]
    colmap = {header.get(c, ""): c for c in "ABCDEFGHIJ" if header.get(c)}
    out = []
    for r in raw_rows[1:]:
        out.append({name: r.get(col, "") for name, col in colmap.items()})
    return out


def clean_desc(s: str) -> str:
    s = (s or "").replace("\\CR", " · ").replace("\r\n", " ").replace("\n", " ")
    return re.sub(r"\s+", " ", s).strip()


def parse_rate(v: object) -> float:
    t = str(v or "").strip().replace("$", "").replace(",", "")
    try:
        return float(t)
    except ValueError:
        return 0.0


def estimate_hours(code: str, name: str, desc: str, rate: float, item_type: str, orig: dict) -> tuple[float, str]:
    if item_type.lower() == "discount" or rate <= 0:
        return 0.0, "list"
    if code in orig:
        try:
            h = float(orig[code].get("hours") or 0)
            if h > 0:
                return h, "book"
        except ValueError:
            pass
    text = f"{name} {desc}".lower()
    if "additional" in text and "hour" in text:
        return 1.0, "add-hour"
    m = re.search(r"up to\s+(\d+(?:\.\d+)?)\s*hrs?", text)
    if m:
        return float(m.group(1)), "desc"
    hrs = round((rate / LABOR_RATE) * 4) / 4
    return max(0.25, hrs), "est"


def hvac_category(code: str, category: str, name: str) -> str:
    cat = (category or "").strip()
    if cat and cat.lower() not in ("services", "service"):
        return cat
    prefix = re.match(r"^([A-Z]{1,3})", code)
    p = prefix.group(1) if prefix else ""
    if p in HVAC_PREFIX:
        return HVAC_PREFIX[p]
    n = name.lower()
    if "discount" in n:
        return "Discount"
    if "service charge" in n or n.endswith(" fee") or " fee" in n:
        return "Service Charge"
    if "filter" in n:
        return "Filters"
    if "thermostat" in n:
        return "Controls"
    return cat or "HVAC"


def plumbing_category(code: str, category: str, name: str, orig: dict) -> str:
    if code in orig and orig[code].get("category"):
        return orig[code]["category"]
    prefix = re.match(r"^([A-Z]{2})", code)
    letter = prefix.group(1) if prefix else ""
    if letter in PLUMB_PREFIX:
        return PLUMB_PREFIX[letter]
    cat = (category or "").strip()
    if cat:
        return cat
    if "discount" in (name or "").lower():
        return "Discount"
    return "Plumbing"


def to_row(book: str, trade: str, item: dict[str, str], orig: dict) -> dict[str, str] | None:
    name = (item.get("Item Name") or "").strip().strip('"').strip()
    if not name:
        return None
    desc = clean_desc(item.get("Description") or "")
    code_u = name.upper()
    if (not desc or desc.upper() == code_u) and code_u in orig:
        od = (orig[code_u].get("description") or "").strip()
        if od and od.upper() != code_u:
            desc = od
    mfg = (item.get("Mfg Part #") or "").strip()
    category = (item.get("Category") or "").strip()
    rate = parse_rate(item.get("Rate"))
    itype = (item.get("Item Type") or "").strip()
    hours, src = estimate_hours(code_u, name, desc, rate, itype, orig)
    if book == "hvac":
        category = hvac_category(code_u, category, name)
    else:
        category = plumbing_category(code_u, category, name, orig)
    notes: list[str] = []
    if mfg:
        notes.append(f"Mfg {mfg}")
    if itype:
        notes.append(itype)
    if src == "est":
        notes.append(f"hours est. from list @ ${int(LABOR_RATE)}/hr — edit if your typical hrs differ")
    if itype.lower() == "discount":
        notes.append("Discount — not sold hours")
    return {
        "book": book,
        "code": name,
        "description": desc or name,
        "category": category,
        "trade": trade,
        "hours": f"{hours:g}",
        "parts_allowance": "0",
        "list_price": f"{rate:.2f}",
        "labor_value": f"{rate:.2f}",
        "active": "false" if itype.lower() == "discount" else "true",
        "notes": "; ".join(notes),
    }


def write_csv(path: Path, rows: list[dict[str, str]], keyfn) -> tuple[int, int]:
    seen: set = set()
    out: list[dict[str, str]] = []
    skipped = 0
    for r in rows:
        k = keyfn(r)
        if k in seen:
            skipped += 1
            continue
        seen.add(k)
        out.append(r)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS, lineterminator="\n", quoting=csv.QUOTE_MINIMAL)
        w.writeheader()
        w.writerows(out)
    return len(out), skipped


def load_overlay(invoice_csv: Path) -> dict:
    orig: dict = {}
    if invoice_csv.exists():
        with invoice_csv.open(newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                code = (row.get("code") or "").strip().upper()
                if code:
                    orig[code] = row
    return orig


def _num(v: object) -> float:
    try:
        return float(str(v or "0").strip() or 0)
    except ValueError:
        return 0.0


def bake_html(html_path: Path, rows: list[dict[str, str]]) -> None:
    """Rewrite window.CODES inside the one-file phone book. No extra files."""
    payload = [
        [
            r.get("book") or "invoice",
            r.get("code") or "",
            r.get("description") or r.get("code") or "",
            r.get("category") or r.get("book") or "",
            _num(r.get("hours")),
            _num(r.get("parts_allowance")),
            _num(r.get("labor_value") or r.get("list_price")),
        ]
        for r in rows
        if (r.get("code") or "").strip()
    ]
    dumped = json.dumps(payload, ensure_ascii=True, separators=(",", ":"))
    text = html_path.read_text(encoding="utf-8")
    marker = "window.CODES = "
    start = text.find(marker)
    if start < 0:
        raise SystemExit(f"no window.CODES in {html_path}")
    i = start + len(marker)
    while i < len(text) and text[i].isspace():
        i += 1
    if i >= len(text) or text[i] != "[":
        raise SystemExit(f"window.CODES is not an array in {html_path}")
    depth = 0
    in_str = False
    esc = False
    end = None
    for j in range(i, len(text)):
        ch = text[j]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                end = j + 1
                break
    if end is None:
        raise SystemExit(f"unterminated window.CODES in {html_path}")
    html_path.write_text(text[:start] + marker + dumped + text[end:], encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--service", type=Path, required=True)
    ap.add_argument("--plumbing", type=Path, required=True)
    ap.add_argument("--out", type=Path, default=Path("public/samples"))
    args = ap.parse_args()

    orig = load_overlay(args.out / "codes-invoice.csv")
    service = parse_service_csv(args.service)
    plumbing = parse_xlsx(args.plumbing)
    hvac_rows = [r for r in (to_row("hvac", "hvac", i, orig) for i in service) if r]
    plumb_rows = [r for r in (to_row("plumbing", "plumbing", i, orig) for i in plumbing) if r]
    n_h, s_h = write_csv(args.out / "codes-hvac.csv", hvac_rows, lambda r: r["code"].upper())
    n_p, s_p = write_csv(args.out / "codes-plumbing.csv", plumb_rows, lambda r: r["code"].upper())

    inv_rows: list[dict[str, str]] = []
    inv_path = args.out / "codes-invoice.csv"
    if inv_path.exists():
        with inv_path.open(newline="", encoding="utf-8") as f:
            inv_rows = [{k: row.get(k, "") for k in FIELDS} for row in csv.DictReader(f)]
    n_a, s_a = write_csv(
        args.out / "codes-all.csv",
        inv_rows + plumb_rows + hvac_rows,
        lambda r: (r["book"], r["code"].upper()),
    )
    print(f"hvac {n_h} (dup {s_h})")
    print(f"plumbing {n_p} (dup {s_p})")
    print(f"all {n_a} (dup {s_a}, invoice {len(inv_rows)})")

    packed_path = args.out / "codes-all.csv"
    packed: list[dict[str, str]] = []
    with packed_path.open(newline="", encoding="utf-8") as f:
        packed = [{k: row.get(k, "") for k in FIELDS} for row in csv.DictReader(f)]
    for hp in (
        Path("public/Maichles-Code-Book.html"),
        Path("public/office/Maichles-Code-Book.html"),
    ):
        if hp.exists():
            bake_html(hp, packed)
            print(f"html {hp} {len(packed)} codes")


if __name__ == "__main__":
    main()
