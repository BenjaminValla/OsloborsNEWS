import json
import re
from datetime import datetime, timedelta, timezone
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

SOURCE_URL = "https://live.euronext.com/nb/ipo-showcase"
ARCHIVE_PATH = "data/archive.json"
OUTPUT_PATH = "data/listings.json"

def parse_date_ddmmyyyy(s: str):
    return datetime.strptime(s.strip(), "%d/%m/%Y").replace(tzinfo=timezone.utc)

def load_archive_items():
    try:
        with open(ARCHIVE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("items", [])
    except FileNotFoundError:
        return []

def save_json(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)

def dedup_key(it: dict) -> str:
    isin = (it.get("isin") or "").strip()
    if isin and isin != "-":
        return f"ISIN:{isin}"
    ticker = (it.get("ticker") or "").strip()
    name = (it.get("company") or "").strip()
    date = (it.get("date") or "").strip()
    return f"FALLBACK:{ticker}|{name}|{date}"

def main():
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=48)

    html = requests.get(SOURCE_URL, timeout=30).text
    soup = BeautifulSoup(html, "lxml")

    scraped = []
    for tr in soup.find_all("tr"):
        tds = [td.get_text(" ", strip=True) for td in tr.find_all("td")]
        if len(tds) < 6:
            continue
        if not re.match(r"^\d{2}/\d{2}/\d{4}$", tds[0]):
            continue

        date_str, company, ticker, isin, location, market = tds[:6]
        loc = (location or "").strip().lower()
        if "oslo" not in loc:
            continue

        a = tr.find("a", href=True)
        url = urljoin(SOURCE_URL, a["href"]) if a else None

        scraped.append({
            "date": date_str,
            "company": company,
            "ticker": ticker,
            "isin": isin,
            "location": location,
            "market": market,
            "url": url
        })

    # Last eksisterende arkiv + merge inn nye
    archive_items = load_archive_items()
    archive_map = {dedup_key(it): it for it in archive_items}

    for it in scraped:
        k = dedup_key(it)
        if k not in archive_map:
            archive_map[k] = it
        else:
            # oppdater felter hvis noe er nytt
            for kk, vv in it.items():
                if vv:
                    archive_map[k][kk] = vv

    combined = list(archive_map.values())
    combined.sort(key=lambda x: parse_date_ddmmyyyy(x["date"]), reverse=True)

    # Split i recent/older
    recent, older = [], []
    threshold = cutoff.replace(hour=0, minute=0, second=0, microsecond=0)
    for it in combined:
        dt = parse_date_ddmmyyyy(it["date"])
        (recent if dt >= threshold else older).append(it)

    generated_at = now.isoformat(timespec="seconds")

    # Lagre arkiv (vokser over tid)
    save_json(ARCHIVE_PATH, {
        "source": SOURCE_URL,
        "generated_at": generated_at,
        "items": combined
    })

    # Fil nettsiden leser
    save_json(OUTPUT_PATH, {
        "source": SOURCE_URL,
        "generated_at": generated_at,
        "cutoff_hours": 48,
        "recent": recent,
        "older": older
    })

if __name__ == "__main__":
    main()
