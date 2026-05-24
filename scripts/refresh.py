"""
refresh.py — Automated tiered festival refresh
Reads from Supabase, checks which festivals need updating based on
grade + last_checked_at, re-enriches them, writes results back directly.

Update logic:
    - status IN (open, closing_soon, upcoming) → SKIP
    - status IN (closed, previous_edition, unknown):
        Grade A → refresh if last_checked_at > 30 days ago
        Grade B → refresh if last_checked_at > 45 days ago
        Grade C/D → refresh if last_checked_at > 90 days ago

Writes directly to Supabase. No CSV, no manual steps.

Usage:
    python3 refresh.py

Env vars:
    SUPABASE_URL
    SUPABASE_KEY      (service role key)
    ANTHROPIC_API_KEY
    BRAVE_API_KEY     (optional — only needed if no official_site in DB)
    DRY_RUN=true      (print what would change without writing)
"""

import os, sys, re, json, time, traceback
from datetime import datetime, timedelta
from urllib.parse import quote_plus

import requests
from bs4 import BeautifulSoup
import anthropic
from supabase import create_client

# ── Config ────────────────────────────────────────────────────────────────────

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
SUPABASE_URL      = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY      = os.environ.get("SUPABASE_KEY", "")
BRAVE_API_KEY     = os.environ.get("BRAVE_API_KEY", "")
DRY_RUN           = os.environ.get("DRY_RUN", "false").lower() == "true"
DELAY             = float(os.environ.get("DELAY", "2.0"))

TODAY = datetime.today().strftime("%Y-%m-%d")
CURRENT_YEAR = datetime.today().year

# Days between checks per grade
REFRESH_THRESHOLDS = {
    "A": 30,
    "B": 45,
    "C": 90,
    "D": 90,
}

# Statuses that mean "don't touch"
SKIP_STATUSES = {"open", "closing_soon", "upcoming"}

# Submission page paths to try
SUBMISSION_PATHS = [
    "/submissions", "/submit", "/entry", "/entries",
    "/call-for-entries", "/call-for-entry", "/participate",
    "/filmmakers", "/how-to-submit", "/apply", "/shorts",
]

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)

# ── Fetch helpers ─────────────────────────────────────────────────────────────

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

def fetch_page(url, timeout=15):
    try:
        r = requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
        if r.status_code != 200:
            return None
        soup = BeautifulSoup(r.text, "html.parser")
        for tag in soup(["script", "style", "noscript", "nav", "footer", "aside"]):
            tag.decompose()
        text = soup.get_text(separator="\n", strip=True)
        return text[:5000] if len(text) > 100 else None
    except:
        return None

def fetch_archive(url):
    try:
        cdx = f"http://archive.org/wayback/available?url={quote_plus(url)}&timestamp={CURRENT_YEAR}0601"
        r = requests.get(cdx, timeout=8)
        snapshot = r.json().get("archived_snapshots", {}).get("closest", {})
        archive_url = snapshot.get("url")
        if not archive_url:
            return None, None
        return fetch_page(archive_url, timeout=20), archive_url
    except:
        return None, None

def find_submission_page(base_url):
    base = base_url.rstrip("/")
    for path in SUBMISSION_PATHS:
        text = fetch_page(base + path)
        if text and has_submission_info(text):
            return text, base + path
    text = fetch_page(base_url)
    return (text, base_url) if text else (None, "")

def has_submission_info(text):
    signals = ["deadline", "submit", "submission", "entry fee", "apply now",
               "call for entries", "filmfreeway", "premiere"]
    tl = text.lower()
    return sum(1 for s in signals if s in tl) >= 2

def is_submissions_closed(text):
    signals = ["submissions are closed", "submissions have closed",
               "submission period has ended", "no longer accepting",
               "submissions closed", "not currently accepting", "check back"]
    return any(s in text.lower() for s in signals)

# ── Extract ───────────────────────────────────────────────────────────────────

def extract_with_claude(client_ai, festival_name, page_text, source_url, is_archive=False):
    archive_note = "NOTE: archived page from previous year." if is_archive else ""
    prompt = f"""Extract film festival submission data from this page.

Festival: {festival_name}
URL: {source_url}
Today: {TODAY}
{archive_note}

Page text:
{page_text}

Return ONLY valid JSON:
{{
  "deadline": "YYYY-MM-DD or null",
  "festival_dates": "e.g. '15-22 Oct 2026' or null",
  "price": number or null,
  "premiere_requirement": "world"|"international"|"national"|"regional"|"none"|null,
  "submission_platform_url": "FilmFreeway/Festhome URL if found, else null",
  "data_is_current_edition": true|false,
  "status": "open"|"closing_soon"|"closed"|"upcoming"|"previous_edition"|"unknown",
  "confidence": "high"|"low"|"none",
  "note": "one sentence"
}}

Rules:
- closing_soon = deadline within 30 days of {TODAY}
- previous_edition = past year data, still fill fields, set data_is_current_edition=false
- confidence high = clear current deadline found
- confidence low = ambiguous or previous year
- confidence none = no useful data
"""
    try:
        msg = client_ai.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = msg.content[0].text.strip()
        raw = re.sub(r"^```json\s*|^```\s*|```$", "", raw, flags=re.MULTILINE).strip()
        return json.loads(raw)
    except:
        return {}

# ── Core enrichment ───────────────────────────────────────────────────────────

def enrich_festival(client_ai, festival):
    name = festival.get("name", "")
    official_site = festival.get("website_url", "").strip()

    if not official_site:
        return None, "no_official_site"

    # Try official submission pages
    page_text, used_url = find_submission_page(official_site)
    used_archive = False

    # Archive fallback
    if not page_text or (page_text and is_submissions_closed(page_text) and not has_submission_info(page_text)):
        archive_text, archive_url = fetch_archive(official_site)
        if archive_text and has_submission_info(archive_text):
            page_text = archive_text
            used_url = archive_url
            used_archive = True

    if not page_text:
        return None, "fetch_failed"

    # Quick closed check — save Claude call
    if is_submissions_closed(page_text) and not has_submission_info(page_text):
        return {
            "status": "closed",
            "last_checked_at": TODAY,
            "notes": "Submissions confirmed closed, no future date found.",
        }, "closed_confirmed"

    extracted = extract_with_claude(client_ai, name, page_text, used_url, is_archive=used_archive)
    if not extracted:
        return None, "extraction_failed"

    confidence = extracted.get("confidence", "none")
    if used_archive and confidence == "high":
        confidence = "low"

    status = extracted.get("status", "unknown")
    if not extracted.get("data_is_current_edition", True) and status not in ("closed", "previous_edition"):
        status = "previous_edition"

    note = extracted.get("note", "")
    if used_archive:
        note = f"[Archive.org] {note}"

    update = {"last_checked_at": TODAY, "status": status}

    # Only update fields if confidence is high or low (not none)
    if confidence in ("high", "low"):
        if extracted.get("deadline"):
            update["deadline"] = extracted["deadline"]
        if extracted.get("festival_dates"):
            update["festival_dates_raw"] = extracted["festival_dates"]
        if extracted.get("price") is not None:
            update["submission_price_usd"] = extracted["price"]
        if extracted.get("premiere_requirement"):
            # Map Claude's output to our DB enum values
            premiere_map = {"national": "north_american", "north_american": "north_american",
                            "world": "world", "international": "international",
                            "regional": "regional", "none": "none"}
            mapped = premiere_map.get(extracted["premiere_requirement"].lower())
            if mapped:
                update["premiere_requirement"] = mapped
        if extracted.get("submission_platform_url"):
            update["submission_url"] = extracted["submission_platform_url"]
        if note:
            update["notes"] = note

    return update, confidence

# ── Main ──────────────────────────────────────────────────────────────────────

def needs_refresh(festival):
    """Determine if this festival should be rechecked based on grade and last_checked_at."""
    status = (festival.get("status") or "unknown").lower()
    if status in SKIP_STATUSES:
        return False, f"skipped ({status})"

    grade = (festival.get("grade") or "C").upper()
    threshold_days = REFRESH_THRESHOLDS.get(grade, 90)

    last_checked = festival.get("last_checked_at")
    if not last_checked:
        return True, "never checked"

    try:
        last_dt = datetime.strptime(str(last_checked)[:10], "%Y-%m-%d")
        days_ago = (datetime.today() - last_dt).days
        if days_ago >= threshold_days:
            return True, f"last checked {days_ago} days ago (threshold: {threshold_days})"
        else:
            return False, f"checked {days_ago} days ago (threshold: {threshold_days})"
    except:
        return True, "invalid last_checked_at"

def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: SUPABASE_URL and SUPABASE_KEY must be set")
        sys.exit(1)

    if DRY_RUN:
        log("DRY RUN MODE — no writes to Supabase")

    client_ai = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    db = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Fetch all non-archived festivals
    log("Fetching festivals from Supabase...")
    result = db.table("festivals").select("*").eq("is_archived", False).execute()
    festivals = result.data
    log(f"Found {len(festivals)} festivals")

    # Determine which need refreshing
    to_refresh = []
    skipped = []
    for f in festivals:
        should_refresh, reason = needs_refresh(f)
        if should_refresh:
            to_refresh.append((f, reason))
        else:
            skipped.append((f["name"], reason))

    log(f"\nTo refresh: {len(to_refresh)} | Skipping: {len(skipped)}")
    log("\nSkipping:")
    for name, reason in skipped[:10]:
        log(f"  {name}: {reason}")
    if len(skipped) > 10:
        log(f"  ... and {len(skipped) - 10} more")

    if not to_refresh:
        log("\nNothing to refresh today.")
        return

    log(f"\nRefreshing {len(to_refresh)} festivals...")

    results = {"updated": 0, "no_data": 0, "failed": 0, "opened": 0}

    for festival, reason in to_refresh:
        name = festival["name"]
        grade = festival.get("grade", "?")
        old_status = festival.get("status", "unknown")
        log(f"\n[Grade {grade}] {name} — {reason}")

        try:
            update, confidence = enrich_festival(client_ai, festival)
        except Exception as e:
            log(f"  ERROR: {e}")
            traceback.print_exc()
            results["failed"] += 1
            continue

        if not update:
            log(f"  No data ({confidence}) — updating last_checked_at only")
            if not DRY_RUN:
                db.table("festivals").update({"last_checked_at": TODAY}).eq("id", festival["id"]).execute()
            results["no_data"] += 1
        else:
            new_status = update.get("status", old_status)
            log(f"  → status: {old_status} → {new_status} | confidence: {confidence}")

            if new_status in ("open", "closing_soon") and old_status not in ("open", "closing_soon"):
                log(f"  *** NEWLY OPENED: {name} ***")
                results["opened"] += 1

            if not DRY_RUN:
                db.table("festivals").update(update).eq("id", festival["id"]).execute()
                log(f"  ✓ Supabase updated")
            else:
                log(f"  [DRY RUN] Would update: {json.dumps(update, indent=2)}")

            results["updated"] += 1

        time.sleep(DELAY)

    log(f"\n{'='*50}")
    log(f"REFRESH COMPLETE — {TODAY}")
    log(f"{'='*50}")
    log(f"Updated:        {results['updated']}")
    log(f"Newly opened:   {results['opened']}")
    log(f"No data found:  {results['no_data']}")
    log(f"Errors:         {results['failed']}")
    log(f"Skipped:        {len(skipped)}")
    log(f"{'='*50}")

if __name__ == "__main__":
    main()
