"""Minimal stdlib-only .xlsx reader (first sheet -> list of row lists)."""
import re
import zipfile
import xml.etree.ElementTree as ET

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def _col_index(ref: str) -> int:
    letters = re.match(r"[A-Z]+", ref).group(0)
    idx = 0
    for ch in letters:
        idx = idx * 26 + (ord(ch) - 64)
    return idx - 1


def read_rows(path: str) -> list[list]:
    with zipfile.ZipFile(path) as z:
        shared = []
        if "xl/sharedStrings.xml" in z.namelist():
            root = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in root.findall("m:si", NS):
                shared.append("".join(t.text or "" for t in si.iter(f"{{{NS['m']}}}t")))
        sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))

    rows = []
    for row in sheet.find("m:sheetData", NS).findall("m:row", NS):
        values: dict[int, object] = {}
        for c in row.findall("m:c", NS):
            v = c.find("m:v", NS)
            if v is None:
                is_ = c.find("m:is", NS)
                values[_col_index(c.get("r"))] = "".join(t.text or "" for t in is_.iter()) if is_ is not None else None
                continue
            t = c.get("t")
            if t == "s":
                val = shared[int(v.text)]
            elif t in ("str", "inlineStr"):
                val = v.text
            else:
                num = float(v.text)
                val = int(num) if num.is_integer() else num
            values[_col_index(c.get("r"))] = val
        width = max(values) + 1 if values else 0
        rows.append([values.get(i) for i in range(width)])
    return rows
