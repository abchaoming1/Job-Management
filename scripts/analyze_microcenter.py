"""Extract MC only from an XLSX export, retaining precision and source rows.

Usage: python scripts/analyze_microcenter.py source.xlsx [microcenter/data.js]
The source is read-only. Output is a timestamped fallback, not live data.
"""
from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET
from posixpath import normpath

SHEET_NAME = "渠道数据总表"
SHEET_ID = "1EOU7HhL5MXJRx6fFAtRk_kKxCL78oFHpvCEOnhtqsZI"
NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def number(value):
    if value is None or not str(value).strip():
        return None
    clean = re.sub(r"USD|US\$", "", str(value), flags=re.I)
    clean = re.sub(r"[$,\s]", "", clean)
    clean = re.sub(r"^\((.*)\)$", r"-\1", clean)
    if not re.fullmatch(r"[+-]?(?:\d+(?:\.\d*)?|\.\d+)", clean):
        raise ValueError(f"Invalid number: {value}")
    return float(clean)


def extract(source):
    with ZipFile(source) as archive:
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        sheet = next(s for s in workbook.findall("s:sheets/s:sheet", NS) if s.attrib["name"] == SHEET_NAME)
        rid = sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]
        rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        target = next(r.attrib["Target"] for r in rels if r.attrib["Id"] == rid)
        path = target.lstrip("/") if target.startswith("/") else normpath("xl/" + target)
        shared = []
        if "xl/sharedStrings.xml" in archive.namelist():
            shared = ["".join(si.itertext()) for si in ET.fromstring(archive.read("xl/sharedStrings.xml"))]
        sheet_xml = ET.fromstring(archive.read(path))
        records = []
        header_found = False
        for row in sheet_xml.findall("s:sheetData/s:row", NS):
            cells = [None] * 8
            for cell in row:
                col = re.match(r"[A-Z]+", cell.attrib["r"]).group()
                if col not in list("ABCDEFGH"):
                    continue
                value = cell.findtext("s:v", default=None, namespaces=NS)
                kind = cell.attrib.get("t")
                if kind == "s":
                    value = shared[int(value)]
                elif kind == "inlineStr":
                    value = "".join(cell.find("s:is", NS).itertext())
                cells[ord(col) - 65] = value
            if cells[1:8] == ["年份", "月份", "渠道", "SKU", "Model", "QTY", "REV"]:
                header_found = True
                continue
            if str(cells[3] or "").strip() != "MC":
                continue
            year, month = number(cells[1]), number(cells[2])
            if year is None or month is None or year != int(year) or month != int(month) or not 1 <= month <= 12:
                raise ValueError(f"Invalid MC period at row {row.attrib['r']}")
            sku = str(cells[4] or "").strip() or "未归属调整"
            records.append(dict(sourceRow=int(row.attrib["r"]), year=int(year), month=int(month), channel="MC", sku=sku, baseSku=sku.split("-")[0], model=str(cells[5] or "").strip(), qty=number(cells[6]), revenue=number(cells[7])))
        if not header_found or not records:
            raise ValueError("MC source schema or records missing")
        return records


def main():
    source = Path(sys.argv[1])
    records = extract(source)
    # Rerunning a saved export must not claim it is a fresh download.
    fetched_at = datetime.fromtimestamp(source.stat().st_mtime, timezone.utc).isoformat()
    payload = {"schema": 2, "source": {"sheetId": SHEET_ID, "gid": "559434467", "sheetName": SHEET_NAME, "channel": "MC"}, "fetchedAt": fetched_at, "records": records}
    if len(sys.argv) > 2:
        Path(sys.argv[2]).write_text("window.MC_DATA = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    yearly, monthly = defaultdict(lambda: [0, 0, 0]), defaultdict(lambda: [0, 0, 0])
    for row in records:
        for table, key in [(yearly, row["year"]), (monthly, f"{row['year']}-{row['month']:02}")]:
            table[key][0] += row["qty"] or 0
            table[key][1] += row["revenue"] or 0
            table[key][2] += 1
    print(json.dumps({"rows": len(records), "yearly_qty_rev_rows": yearly, "monthly_2025": {k: v for k, v in monthly.items() if k.startswith("2025")}}, indent=2))


if __name__ == "__main__":
    main()
