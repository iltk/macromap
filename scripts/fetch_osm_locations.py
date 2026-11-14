"""Fetch chain locations in Toronto from OpenStreetMap (Overpass API).

Writes scripts/data/toronto_locations.json. Run `python3 build_seed.py` afterwards.
Data (c) OpenStreetMap contributors, ODbL.
"""
import json
import pathlib
import urllib.parse
import urllib.request

# south, west, north, east: City of Toronto
BBOX = (43.581, -79.639, 43.855, -79.115)

# slug -> OSM brand matching (brand:wikidata where stable, plus brand/name fallbacks)
CHAINS = {
    "aw": {"wikidata": ["Q2818848"], "names": ["A&W"]},
    "mcdonalds": {"wikidata": ["Q38076"], "names": ["McDonald's"]},
    "tim-hortons": {"wikidata": ["Q175106"], "names": ["Tim Hortons"]},
}

OUT = pathlib.Path(__file__).parent / "data" / "toronto_locations.json"


def build_query() -> str:
    bbox = ",".join(str(x) for x in BBOX)
    parts = []
    for spec in CHAINS.values():
        for q in spec["wikidata"]:
            parts.append(f'nwr["brand:wikidata"="{q}"]({bbox});')
        for n in spec["names"]:
            esc = n.replace('"', '\\"')
            parts.append(f'nwr["brand"="{esc}"]({bbox});')
            parts.append(f'nwr["name"="{esc}"]["amenity"~"fast_food|cafe|restaurant"]({bbox});')
    return f"[out:json][timeout:90];({''.join(parts)});out center tags;"


def classify(tags: dict) -> str | None:
    wd = tags.get("brand:wikidata")
    for slug, spec in CHAINS.items():
        if wd in spec["wikidata"]:
            return slug
    for key in ("brand", "name"):
        val = tags.get(key, "")
        for slug, spec in CHAINS.items():
            if val in spec["names"]:
                return slug
    return None


def main() -> None:
    data = urllib.parse.urlencode({"data": build_query()}).encode()
    req = urllib.request.Request(
        "https://overpass-api.de/api/interpreter",
        data=data,
        headers={"User-Agent": "macromap-seed-script/1.0"},
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        payload = json.load(resp)

    out, seen = [], set()
    for el in payload["elements"]:
        tags = el.get("tags", {})
        slug = classify(tags)
        if not slug:
            continue
        # skip closed / disused places
        if any(k.startswith(("disused:", "was:")) for k in tags) or tags.get("opening_hours") == "closed":
            continue
        lat = el.get("lat") or el.get("center", {}).get("lat")
        lon = el.get("lon") or el.get("center", {}).get("lon")
        if lat is None or lon is None:
            continue
        osm_id = {"node": 1, "way": 2, "relation": 3}[el["type"]] * 10**12 + el["id"]
        if osm_id in seen:
            continue
        seen.add(osm_id)
        street = " ".join(p for p in (tags.get("addr:housenumber"), tags.get("addr:street")) if p)
        out.append({
            "osm_id": osm_id,
            "slug": slug,
            "lat": round(lat, 6),
            "lon": round(lon, 6),
            "address": street or None,
            "city": tags.get("addr:city") or "Toronto",
            "postcode": tags.get("addr:postcode"),
            "phone": tags.get("phone") or tags.get("contact:phone"),
            "opening_hours": tags.get("opening_hours"),
        })

    out.sort(key=lambda r: (r["slug"], r["osm_id"]))
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    by = {}
    for r in out:
        by[r["slug"]] = by.get(r["slug"], 0) + 1
    print(f"wrote {len(out)} locations to {OUT}: {by}")


if __name__ == "__main__":
    main()
