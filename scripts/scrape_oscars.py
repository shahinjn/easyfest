"""
scrape_oscars.py — Scrapes the Academy's Oscar-qualifying festival list
and updates oscar_qualifying field in Supabase directly.

The Academy publishes a yearly press release listing all Oscar-qualifying
festivals. We fetch it, extract festival names, fuzzy-match against our
Supabase records, and update the boolean.

Usage:
    python3 scrape_oscars.py

Env vars:
    SUPABASE_URL
    SUPABASE_KEY  (service role key for writes)
    ANTHROPIC_API_KEY
"""

import os, sys, re, json
from datetime import datetime

import requests
from bs4 import BeautifulSoup
import anthropic
from supabase import create_client

# ── Config ────────────────────────────────────────────────────────────────────

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
SUPABASE_URL      = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY      = os.environ.get("SUPABASE_KEY", "")  # service role key

CURRENT_YEAR = datetime.today().year

# Academy press release URLs to try (current + previous year)
OSCAR_SOURCES = [
    f"https://www.oscars.org/news/academy-announces-qualifying-festivals-{CURRENT_YEAR}-awards",
    f"https://www.oscars.org/news/academy-announces-qualifying-festivals-{CURRENT_YEAR - 1}-awards",
    "https://www.oscars.org/oscars/rules-eligibility/special-rules/short-films-and-feature-documentaries",
]

# Fallback: well-known Oscar-qualifying short film festivals (hardcoded safety net)
KNOWN_OSCAR_QUALIFYING = [
    "Sundance Film Festival",
    "Tribeca Film Festival",
    "SXSW Film Festival",
    "Toronto International Film Festival",
    "Berlin International Film Festival",
    "Cannes Film Festival",
    "Venice Film Festival",
    "Hot Docs",
    "Palm Springs International ShortFest",
    "Clermont-Ferrand International Short Film Festival",
    "Oberhausen International Short Film Festival",
    "Tampere Film Festival",
    "Aspen Shortfest",
    "HollyShorts Film Festival",
    "Nashville Film Festival",
    "Rhode Island International Film Festival",
    "Heartland Film Festival",
    "Cleveland International Film Festival",
    "Atlanta Film Festival",
    "Flickers Rhode Island International Film Festival",
]

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)

def fetch_page(url):
    try:
        r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=12)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            for tag in soup(["script", "style", "nav", "footer"]):
                tag.decompose()
            return soup.get_text(separator="\n", strip=True)[:8000]
    except:
        pass
    return None

def extract_oscar_festivals(client_ai, page_text, source_url):
    """Use Claude to extract festival names from Academy press release."""
    prompt = f"""This is text from an Academy Awards press release or eligibility page.
Extract all film festival names that are listed as Oscar-qualifying for short films.

Source: {source_url}

Text:
{page_text}

Return ONLY a JSON array of festival name strings. No markdown, no explanation.
Example: ["Sundance Film Festival", "Tribeca Film Festival", ...]

If no qualifying festivals are listed, return an empty array: []
"""
    try:
        msg = client_ai.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = msg.content[0].text.strip()
        raw = re.sub(r"^```json\s*|^```\s*|```$", "", raw, flags=re.MULTILINE).strip()
        return json.loads(raw)
    except Exception as e:
        log(f"  Extraction error: {e}")
        return []

def normalize_name(name):
    """Lowercase, strip punctuation for fuzzy matching."""
    return re.sub(r'[^a-z0-9 ]', '', name.lower()).strip()

def fuzzy_match(oscar_name, db_names):
    """
    Return the best matching DB festival name for an Oscar list entry.
    Uses word overlap scoring.
    """
    oscar_words = set(normalize_name(oscar_name).split())
    best_match = None
    best_score = 0

    for db_name in db_names:
        db_words = set(normalize_name(db_name).split())
        overlap = len(oscar_words & db_words)
        total = len(oscar_words | db_words)
        score = overlap / total if total > 0 else 0

        if score > best_score and score >= 0.5:  # 50% word overlap threshold
            best_score = score
            best_match = db_name

    return best_match, best_score

def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: SUPABASE_URL and SUPABASE_KEY must be set")
        print("  export SUPABASE_URL=https://xxx.supabase.co")
        print("  export SUPABASE_KEY=your_service_role_key")
        sys.exit(1)

    client_ai = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    db = create_client(SUPABASE_URL, SUPABASE_KEY)

    # ── Step 1: Fetch all festivals from Supabase ──
    log("Fetching festivals from Supabase...")
    result = db.table("festivals").select("id, name, oscar_qualifying").execute()
    festivals = result.data
    db_names = [f["name"] for f in festivals]
    log(f"Found {len(festivals)} festivals in database")

    # ── Step 2: Try to fetch Oscar qualifying list from Academy ──
    oscar_festivals = []
    for url in OSCAR_SOURCES:
        log(f"Trying: {url}")
        text = fetch_page(url)
        if text:
            extracted = extract_oscar_festivals(client_ai, text, url)
            if extracted:
                oscar_festivals = extracted
                log(f"  Extracted {len(extracted)} Oscar-qualifying festivals from {url}")
                break
        else:
            log(f"  Could not fetch {url}")

    # Fall back to hardcoded list if Academy page unavailable
    if not oscar_festivals:
        log("Using hardcoded known Oscar-qualifying list as fallback")
        oscar_festivals = KNOWN_OSCAR_QUALIFYING

    log(f"\nOscar-qualifying festivals found: {len(oscar_festivals)}")

    # ── Step 3: Match against DB and update ──
    matched = []
    unmatched = []

    for oscar_name in oscar_festivals:
        db_match, score = fuzzy_match(oscar_name, db_names)
        if db_match:
            matched.append((oscar_name, db_match, score))
        else:
            unmatched.append(oscar_name)

    log(f"\nMatched: {len(matched)} | Unmatched: {len(unmatched)}")

    # First reset all to False
    log("\nResetting all oscar_qualifying to False...")
    db.table("festivals").update({"oscar_qualifying": False}).neq("id", "00000000-0000-0000-0000-000000000000").execute()

    # Then set matched ones to True
    log("Setting matched festivals to oscar_qualifying=True...")
    updated = 0
    for oscar_name, db_name, score in matched:
        festival = next(f for f in festivals if f["name"] == db_name)
        db.table("festivals").update({
            "oscar_qualifying": True,
            "last_checked_at": datetime.today().strftime("%Y-%m-%d")
        }).eq("id", festival["id"]).execute()
        log(f"  ✓ {db_name} (matched '{oscar_name}', score={score:.2f})")
        updated += 1

    log(f"\n{'='*50}")
    log(f"OSCAR UPDATE COMPLETE")
    log(f"{'='*50}")
    log(f"Updated to qualifying: {updated}")
    log(f"Unmatched (not in DB): {len(unmatched)}")
    if unmatched:
        log(f"\nUnmatched Oscar festivals (consider adding to DB):")
        for name in unmatched:
            log(f"  - {name}")

if __name__ == "__main__":
    main()
