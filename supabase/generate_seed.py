#!/usr/bin/env python3
"""
Transforms festivals_enriched.csv → seed.sql for Supabase.

Merge strategy: prefer *_new enrichment values, fall back to originals.
Run: python3 supabase/generate_seed.py
"""

import csv
import re
import sys
from datetime import datetime
from pathlib import Path

CSV_PATH = Path("/Users/shahinjn/festify-enrichment/festivals_enriched.csv")
OUT_PATH = Path(__file__).parent / "seed.sql"

# ── normalisation helpers ────────────────────────────────────────────────────

PREMIERE_MAP = {
    "world": "world",
    "international": "international",
    "north_american": "north_american",
    "national": "north_american",  # old label
    "regional": "regional",
    "none": "none",
    "other": "none",
    "": "none",
}

STATUS_MAP = {
    "open": "open",
    "closing_soon": "closing_soon",
    "closed": "closed",
    "upcoming": "upcoming",
    "previous_edition": "previous_edition",
    "unknown": "unknown",
    "": "unknown",
}

VALID_GRADES = {"A", "B", "C", "D"}


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


def sql_str(val: str | None) -> str:
    if val is None or val == "":
        return "NULL"
    val = val.replace("'", "''")
    return f"'{val}'"


def sql_bool(val: str | None, default: bool = False) -> str:
    if val is None or val == "":
        return "true" if default else "false"
    return "true" if val.strip().lower() in ("true", "1", "yes", "t") else "false"


def sql_decimal(val: str | None) -> str:
    if val is None or val == "":
        return "NULL"
    try:
        f = float(val)
        return f"{f:.2f}" if f >= 0 else "NULL"
    except ValueError:
        return "NULL"


def parse_date(val: str | None) -> str:
    """Return SQL DATE literal or NULL."""
    if not val or val.strip() == "":
        return "NULL"
    val = val.strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%B %d, %Y", "%d %B %Y"):
        try:
            d = datetime.strptime(val, fmt)
            return f"'{d.strftime('%Y-%m-%d')}'"
        except ValueError:
            pass
    # Try "DD Mon YYYY" like "25 Jan 2026"
    try:
        d = datetime.strptime(val, "%d %b %Y")
        return f"'{d.strftime('%Y-%m-%d')}'"
    except ValueError:
        pass
    return "NULL"


def parse_festival_dates(raw: str | None):
    """
    Attempt to parse 'festival_dates_new' / 'festival_dates_raw' into
    (start_date, end_date) as SQL literals.

    Handles formats like:
      '22 Jan - 1 Feb 2026'
      '2-5 Feb 2026'
      '12-18 Mar 2026'
      '01/2022'  (month/year only — skip)
    """
    null = ("NULL", "NULL")
    if not raw or raw.strip() == "":
        return null
    raw = raw.strip()

    # Skip month/year-only strings like "01/2022"
    if re.match(r"^\d{2}/\d{4}$", raw):
        return null

    # Pattern: "22 Jan - 1 Feb 2026" or "22 Jan 2026 - 1 Feb 2026"
    m = re.match(
        r"(\d{1,2})\s+(\w+)(?:\s+(\d{4}))?\s*[-–]\s*(\d{1,2})\s+(\w+)\s+(\d{4})",
        raw,
    )
    if m:
        d1, mon1, yr1, d2, mon2, yr2 = m.groups()
        yr1 = yr1 or yr2
        try:
            start = datetime.strptime(f"{d1} {mon1} {yr1}", "%d %b %Y")
            end = datetime.strptime(f"{d2} {mon2} {yr2}", "%d %b %Y")
            return f"'{start.strftime('%Y-%m-%d')}'", f"'{end.strftime('%Y-%m-%d')}'"
        except ValueError:
            pass

    # Pattern: "2-5 Feb 2026" (same month)
    m = re.match(r"(\d{1,2})\s*[-–]\s*(\d{1,2})\s+(\w+)\s+(\d{4})", raw)
    if m:
        d1, d2, mon, yr = m.groups()
        try:
            start = datetime.strptime(f"{d1} {mon} {yr}", "%d %b %Y")
            end = datetime.strptime(f"{d2} {mon} {yr}", "%d %b %Y")
            if start > end:
                return null  # ambiguous / bad data
            return f"'{start.strftime('%Y-%m-%d')}'", f"'{end.strftime('%Y-%m-%d')}'"
        except ValueError:
            pass

    return null


def merge(new_val: str, old_val: str) -> str:
    """Return new_val if non-empty, else old_val."""
    return new_val.strip() if new_val and new_val.strip() else (old_val or "")


def process_row(row: dict) -> dict | None:
    name = row["name"].strip()
    if not name:
        return None

    # Premiere requirement
    raw_premiere = merge(row["premiere_requirement_new"], row["premiere_requirement"])
    premiere = PREMIERE_MAP.get(raw_premiere.lower(), "none")

    # Status
    raw_status = merge(row["status_new"], row["status"])
    status = STATUS_MAP.get(raw_status.lower(), "unknown")

    # Grade
    grade = row["grade"].strip().upper() if row["grade"].strip() else None
    if grade not in VALID_GRADES:
        grade = None

    # Price
    raw_price = merge(row["price_new"], row["submission_price_usd"])
    price = sql_decimal(raw_price)

    # Deadline
    raw_deadline = merge(row["deadline_new"], row["deadline"])
    deadline = parse_date(raw_deadline)

    # Festival dates
    raw_dates = merge(row["festival_dates_new"], row["festival_dates_raw"])
    fest_start, fest_end = parse_festival_dates(raw_dates)

    # Submission URL
    sub_url = merge(row["submission_url_new"], row["submission_url"])

    # Notes: combine admin notes + search note
    notes_parts = [p for p in [row.get("notes", ""), row.get("search_note", "")] if p.strip()]
    notes = " | ".join(notes_parts) if notes_parts else ""

    # Last checked
    lc_raw = row.get("last_checked_at", "")
    last_checked = parse_date(lc_raw) if lc_raw else "NULL"

    return {
        "name": name,
        "slug": slugify(name),
        "country": row["country"].strip() or "Unknown",
        "submission_url": sub_url,
        "premiere_requirement": premiere,
        "oscar_qualifying": sql_bool(row["oscar_qualifying"]),
        "grade": grade,
        "submission_price_usd": price,
        "deadline": deadline,
        "festival_start_date": fest_start,
        "festival_end_date": fest_end,
        "festival_dates_raw": raw_dates,
        "status": status,
        "enrichment_confidence": row.get("confidence", "").strip() or None,
        "notes": notes or None,
        "last_checked_at": last_checked,
    }


def row_to_sql(r: dict) -> str:
    grade_sql = f"'{r['grade']}'" if r["grade"] else "NULL"
    return (
        f"  ({sql_str(r['name'])}, {sql_str(r['slug'])}, {sql_str(r['country'])}, "
        f"{sql_str(r['submission_url'])}, "
        f"'{r['premiere_requirement']}'::{{}}, "
        f"{r['oscar_qualifying']}, "
        f"{grade_sql}::festival_grade, "
        f"{r['submission_price_usd']}, "
        f"{r['deadline']}, "
        f"{r['festival_start_date']}, "
        f"{r['festival_end_date']}, "
        f"{sql_str(r['festival_dates_raw'])}, "
        f"'{r['status']}'::festival_status, "
        f"{sql_str(r['enrichment_confidence'])}, "
        f"{sql_str(r['notes'])}, "
        f"{r['last_checked_at']})"
    ).format("premiere_requirement")


def main():
    rows = []
    slugs_seen: set[str] = set()

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for raw in reader:
            processed = process_row(raw)
            if not processed:
                continue
            # Deduplicate slugs
            base_slug = processed["slug"]
            slug = base_slug
            n = 1
            while slug in slugs_seen:
                slug = f"{base_slug}-{n}"
                n += 1
            slugs_seen.add(slug)
            processed["slug"] = slug
            rows.append(processed)

    lines = [
        "-- Festify seed data — auto-generated by generate_seed.py",
        f"-- Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
        f"-- Festivals: {len(rows)}",
        "",
        "INSERT INTO festivals (",
        "  name, slug, country, submission_url,",
        "  premiere_requirement, oscar_qualifying, grade,",
        "  submission_price_usd, deadline,",
        "  festival_start_date, festival_end_date, festival_dates_raw,",
        "  status, enrichment_confidence, notes, last_checked_at",
        ") VALUES",
    ]

    value_lines = [row_to_sql(r) for r in rows]
    lines.append(",\n".join(value_lines) + ";")
    lines.append("")
    lines.append(f"-- {len(rows)} festivals inserted")

    OUT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"✓ Wrote {len(rows)} festivals to {OUT_PATH}")


if __name__ == "__main__":
    main()
