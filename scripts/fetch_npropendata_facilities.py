"""
Fase 2a – Garages en P+R uit npropendata.rdw.nl naar Firestore.
Haalt facility-lijst op, filtert op garage + P+R (geen Carpool/Straatparkeren),
parst static data per facility en schrijft naar collectie `facilities`.
Zie: docs/PLAN_GARAGES_P_R_NPROPENDATA.md

Gebruik (vanuit projectroot):
  python scripts/fetch_npropendata_facilities.py
  python scripts/fetch_npropendata_facilities.py --dry-run   # geen Firestore, alleen print
"""
import argparse
import json
import os
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except ImportError:
    print("firebase_admin required: pip install firebase-admin")
    sys.exit(2)

# --- Config ---
FACILITY_LIST_URL = "https://npropendata.rdw.nl/parkingdata/v2/"
CONCURRENT_REQUESTS = 5
REQUEST_DELAY_SEC = 0.3  # tussen requests om RDW niet te belasten


def _is_garage_or_pr(name):
    """Include alleen garage en P+R; geen Carpool, Straatparkeren, vergunning, etc."""
    if not name:
        return False
    n = name.strip().lower()
    if "carpool" in n or "straatparkeren" in n or "vergunningzone" in n:
        return False
    if "bezoekersparkeren" in n or "bezoekersregeling" in n:
        return False
    if "garage" in n or "parkeergarage" in n:
        return True
    if "p+r" in n or "p+r-terrein" in n:
        return True
    return False


def _facility_type_from_name(name):
    if not name:
        return "garage"
    n = name.strip().lower()
    if "p+r" in n or "p+r-terrein" in n:
        return "p_r"
    return "garage"


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "B2B-Parkeren-Facilities/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _opening_times_summary(info):
    """Bouw korte samenvatting uit openingTimes[] (bijv. '24/7' of 'Ma-Vr 07:00-23:00')."""
    times = info.get("openingTimes") or []
    if not times:
        return None
    ot = times[0]
    if ot.get("openAllYear") and ot.get("exitPossibleAllDay"):
        entry_times = ot.get("entryTimes") or []
        if not entry_times:
            return "24/7"
        all_day = True
        for et in entry_times:
            fr = et.get("enterFrom") or {}
            to = et.get("enterUntil") or {}
            if (fr.get("h"), fr.get("m")) != (0, 0) or (to.get("h"), to.get("m")) != (23, 59):
                all_day = False
                break
        if all_day and len(entry_times) >= 7:
            return "24/7"
    # Eerste entry: format tijd en dagen
    et = entry_times[0] if entry_times else None
    if not et:
        return None
    fr = et.get("enterFrom") or {}
    to = et.get("enterUntil") or {}
    h1, m1 = fr.get("h", 0), fr.get("m", 0)
    h2, m2 = to.get("h", 23), to.get("m", 59)
    time_str = f"{h1:02d}:{m1:02d}-{h2:02d}:{m2:02d}"
    days = et.get("dayNames") or []
    day_map = {"Mon": "Ma", "Tue": "Di", "Wed": "Wo", "Thu": "Do", "Fri": "Vr", "Sat": "Za", "Sun": "Zo"}
    day_str = "-".join(day_map.get(d, d) for d in days[:2]) if len(days) <= 2 else (day_map.get(days[0], days[0]) + "-" + day_map.get(days[-1], days[-1]) if days else "")
    return f"{day_str} {time_str}" if day_str else time_str


def parse_static_data(static_json, list_item):
    """Haal uit static JSON de velden voor Firestore (zie plan sectie 3.2 + 3.3)."""
    info = static_json.get("parkingFacilityInformation") or {}
    out = {
        "id": list_item.get("identifier"),
        "name": info.get("name") or list_item.get("name"),
        "description": info.get("description"),
        "lat": None,
        "lng": None,
        "type": _facility_type_from_name(list_item.get("name", "")),
        "city": None,
        "street": None,
        "tariffSummary": None,
        "dynamicDataUrl": list_item.get("dynamicDataUrl") or None,
        "capacity": None,
        "chargingPointCapacity": None,
        "disabledAccess": None,
        "minimumHeightInMeters": None,
        "operatorUrl": None,
        "openingTimesSummary": None,
        "paymentMethods": None,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    # Specifications (eerste item)
    specs = info.get("specifications") or []
    if specs:
        s = specs[0]
        if s.get("capacity") is not None:
            out["capacity"] = int(s["capacity"])
        if s.get("chargingPointCapacity") is not None:
            out["chargingPointCapacity"] = int(s["chargingPointCapacity"])
        if s.get("disabledAccess") is not None:
            out["disabledAccess"] = bool(s["disabledAccess"])
        if s.get("minimumHeightInMeters") is not None:
            try:
                out["minimumHeightInMeters"] = float(s["minimumHeightInMeters"])
            except (TypeError, ValueError):
                pass

    # Locatie: eerste accessPoint, eerste accessPointLocation
    access_points = info.get("accessPoints") or []
    if access_points:
        ap = access_points[0]
        locs = ap.get("accessPointLocation") or []
        if locs:
            loc = locs[0]
            try:
                out["lat"] = float(loc.get("latitude"))
                out["lng"] = float(loc.get("longitude"))
            except (TypeError, ValueError):
                pass
        addr = ap.get("accessPointAddress") or {}
        out["city"] = addr.get("city")
        sn = addr.get("streetName") or ""
        hn = addr.get("houseNumber") or ""
        out["street"] = f"{sn} {hn}".strip() or None

    op = info.get("operator") or {}
    if not out["city"]:
        out["city"] = op.get("name")
    if op.get("url"):
        out["operatorUrl"] = op["url"] if op["url"].startswith("http") else "https://" + op["url"]

    # Tariefsamenvatting: eerste tariff, eerste intervalRate
    tariffs = info.get("tariffs") or []
    if tariffs:
        t = tariffs[0]
        rates = t.get("intervalRates") or []
        if rates:
            r = rates[0]
            charge = r.get("charge")
            period = r.get("chargePeriod")
            if charge is not None and period is not None:
                if period >= 1440:
                    out["tariffSummary"] = f"€ {charge:.2f} / dag"
                else:
                    out["tariffSummary"] = f"€ {charge:.2f} / {int(period)} min"

    # Openingstijden-samenvatting
    out["openingTimesSummary"] = _opening_times_summary(info)

    # Betaalmethoden: lijst van method-namen
    methods = info.get("paymentMethods") or []
    if methods:
        out["paymentMethods"] = [m.get("method") for m in methods if m.get("method")]

    return out


def fetch_one_facility(list_item, dry_run=False):
    """Haal static data op en retourneer dict voor Firestore (of None bij fout)."""
    name = list_item.get("name", "")
    if not _is_garage_or_pr(name):
        return None
    url = list_item.get("staticDataUrl")
    if not url:
        return None
    try:
        time.sleep(REQUEST_DELAY_SEC)
        data = fetch_json(url)
        doc = parse_static_data(data, list_item)
        if doc.get("lat") is None or doc.get("lng") is None:
            return None  # geen coördinaten → niet bruikbaar voor kaart
        return doc
    except Exception as e:
        if not dry_run:
            print(f"  Skip {name[:50]}: {e}", file=sys.stderr)
        return None


def main():
    parser = argparse.ArgumentParser(description="Fetch npropendata facilities (garage + P+R) to Firestore")
    parser.add_argument("--dry-run", action="store_true", help="Do not write to Firestore, only print count and sample")
    parser.add_argument("--limit", type=int, default=0, help="Max number of facilities to fetch (0 = all)")
    args = parser.parse_args()

    # Firebase (vanuit projectroot: service-account.json)
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cred_path = os.path.join(root, "service-account.json")
    if not os.path.isfile(cred_path):
        cred_path = os.path.join(root, "q8-parking-pwa-firebase-adminsdk-fbsvc-9e50406bcb.json")
    if not args.dry_run and not os.path.isfile(cred_path):
        print(f"Firebase credentials not found: {cred_path}", file=sys.stderr)
        sys.exit(2)
    if not args.dry_run:
        try:
            cred = credentials.Certificate(cred_path)
            firebase_admin.get_app()
        except ValueError:
            firebase_admin.initialize_app(cred)
        db = firestore.client()

    print("Fetching facility list...")
    raw = fetch_json(FACILITY_LIST_URL)
    facilities_list = raw.get("ParkingFacilities") or []
    to_fetch = [f for f in facilities_list if _is_garage_or_pr(f.get("name") or "")]
    if args.limit:
        to_fetch = to_fetch[: args.limit]
    print(f"Found {len(to_fetch)} garage/P+R facilities (of {len(facilities_list)} total).")

    results = []
    with ThreadPoolExecutor(max_workers=CONCURRENT_REQUESTS) as executor:
        futures = {executor.submit(fetch_one_facility, item, args.dry_run): item for item in to_fetch}
        for i, future in enumerate(as_completed(futures)):
            doc = future.result()
            if doc:
                results.append(doc)
            if (i + 1) % 50 == 0:
                print(f"  Progress: {i + 1}/{len(to_fetch)}")
    print(f"Parsed {len(results)} facilities with valid coordinates.")

    if args.dry_run:
        for d in results[:5]:
            print(f"  {d.get('type')}: {d.get('name')} @ {d.get('city')} ({d.get('lat')}, {d.get('lng')})")
        return

    coll = db.collection("facilities")
    for doc in results:
        doc_id = doc["id"]
        # Firestore document ID moet string zijn; UUID mag
        coll.document(doc_id).set(doc)
    print(f"Written {len(results)} documents to Firestore collection 'facilities'.")


if __name__ == "__main__":
    main()
