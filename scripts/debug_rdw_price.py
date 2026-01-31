import urllib.request, json, urllib.parse, os
from datetime import datetime

# --- Config ---
MAPPING_URL = "https://opendata.rdw.nl/resource/qtex-qwd8.json"
TIJDVAK_URL = "https://opendata.rdw.nl/resource/ixf8-gtwq.json"
TARIEFDEEL_URL = "https://opendata.rdw.nl/resource/534e-5vdg.json"
DESC_URL = "https://opendata.rdw.nl/resource/yefi-qfiq.json"
AREAS_URL = "https://opendata.rdw.nl/resource/b3us-f26s.json"
CALC_URL = "https://opendata.rdw.nl/resource/nfzq-8g7y.json"

TARGET_MGR = "599" # Rotterdam
TARGET_ZONE = "S1"

def fetch_json(url, params=None):
    if params:
        url += "?" + urllib.parse.urlencode(params)
    print(f"Requesting: {url}")
    with urllib.request.urlopen(url) as response:
        return json.loads(response.read().decode('utf-8'))

def run_debug():
    print(f"DEBUGGING ZONE: {TARGET_MGR} - {TARGET_ZONE}")
    today = datetime.now().strftime("%Y%m%d")
    print(f"Today: {today}")

    # 1. Fetch Zone Spec
    print("Fetching Area Spec...")
    zones = fetch_json(AREAS_URL, {"areamanagerid": TARGET_MGR, "areaid": TARGET_ZONE})
    if not zones:
        print("Zone not found in AREAS_URL")
    else:
        print("Zone found:", zones[0])

    # 2. Mappings
    print("Fetching Mapping...")
    mappings = fetch_json(MAPPING_URL, {"areamanagerid": TARGET_MGR, "areaid": TARGET_ZONE})

    rids = []
    for m in mappings:
        start = m.get('startdatearearegulation', '0')
        end = m.get('enddatearearegulation', '99999999')
        if not end: end = '99999999'

        print(f"  Mapping Object: {m}")
        print(f"  Mapping: RegID={m.get('regulationid')} Start={start} End={end}")

        if start <= today <= end:
            rids.append(m.get('regulationid'))
        else:
            print("    -> SKIPPED (Date mismatch)")

    print(f"Active Regulation IDs: {rids}")

    if not rids:
        print("NO ACTIVE REGULATIONS FOUND. Price will be 0.")
        return

    # 2.5 Fetch Description of Calc Code
    calcs = fetch_json(CALC_URL, {"areamanagerid": TARGET_MGR})
    calc_desc_map = {c['farecalculationcode']: c.get('farecalculationdesc', 'Unknown') for c in calcs}

    # 3. Time Slots & Tariffs
    for rid in rids:
        print(f"\nChecking Regulation: {rid}")

        # Slots
        slots = fetch_json(TIJDVAK_URL, {"areamanagerid": TARGET_MGR, "regulationid": rid})
        print(f"  Found {len(slots)} time slots")

        for s in slots:
            calc_code = s.get('farecalculationcode')
            desc = calc_desc_map.get(calc_code, "Unknown")
            day = s.get('daytimeframe')
            start_t = s.get('starttimetimeframe')
            end_t = s.get('endtimetimeframe')

            print(f"    Slot: {day} {start_t}-{end_t} (Code: {calc_code} - {desc})")

            # Tariff Parts
            parts = fetch_json(TARIEFDEEL_URL, {"areamanagerid": TARGET_MGR, "farecalculationcode": calc_code})
            # Sort by date desc
            parts.sort(key=lambda x: x.get('startdatefarepart', '0'), reverse=True)

            found_part = False
            for p in parts:
                p_start = p.get('startdatefarepart', '0')
                p_end = p.get('enddatefarepart', '99999999')
                if not p_end: p_end = '99999999'

                amt = float(p.get('amountfarepart', 0))
                step = float(p.get('stepsizefarepart', 1))
                rate = (amt/step)*60 if step > 0 else 0

                status = "INACTIVE"
                if p_start <= today <= p_end:
                    status = "ACTIVE  "
                    found_part = True

                print(f"      [{status}] Start={p_start} End={p_end} Rate={rate:.2f} (Amt={amt} Step={step})")

            if not found_part:
                print("      -> NO ACTIVE TARIFF PART FOUND")

if __name__ == "__main__":
    run_debug()
