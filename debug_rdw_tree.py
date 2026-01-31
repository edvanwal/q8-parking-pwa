import urllib.request, json, urllib.parse

MGR_ID = "363" # Amsterdam
AREA_ID_INTERNAL = "T12B_U11" # We suspect this is 12100 based on previous findings
# Or we can search for which area maps to 12100 if we aren't sure.
TARGET_DISPLAY_ID = "12100"

# URLs
MAPPING_URL = "https://opendata.rdw.nl/resource/qtex-qwd8.json"
USAGE_URL = "https://opendata.rdw.nl/resource/qtex-qwd8.json" # Same as mapping? Wait. No.
# Usage is in the mapping dataset 'usageid'.

TIJDVAK_URL = "https://opendata.rdw.nl/resource/ixf8-gtwq.json"
TARIEF_URL = "https://opendata.rdw.nl/resource/534e-5vdg.json"
CALC_URL = "https://opendata.rdw.nl/resource/nfzq-8g7y.json"

def fetch(url, params):
    u = url + "?" + urllib.parse.urlencode(params)
    print(f"Fetching {u}")
    with urllib.request.urlopen(u) as r:
        return json.loads(r.read().decode())

def run():
    print(f"--- DEBUGGING ZONE {TARGET_DISPLAY_ID} ({MGR_ID}) ---")

    # 1. Find Area ID(s) for 12100 if possible, or use known one
    # We'll just look for T12B_U11 for now as that's what we found earlier.
    # Actually, let's search mapping for anything related to this.

    # In the previous step, we found '363_T12B_U11'.

    area_ids = ["12100"]

    for aid in area_ids:
        print(f"\nAnalyzing AreaID: {aid}")

        # 2. Get Regulations (Mapping)
        mappings = fetch(MAPPING_URL, {"areamanagerid": MGR_ID, "areaid": aid})
        print(f"Found {len(mappings)} mappings:")
        for m in mappings:
            print(f"  - RegID: {m.get('regulationid')} | Usage: {m.get('usageid')} | Start: {m.get('startdatearearegulation')} | End: {m.get('enddatearearegulation')}")

            reg_id = m.get('regulationid')
            if not reg_id: continue

            # 3. Get Time Frames
            # Note: We need to filter for the currently valid one if multiple exist?
            # RDW usually returns history too.

            slots = fetch(TIJDVAK_URL, {"areamanagerid": MGR_ID, "regulationid": reg_id})
            print(f"    Found {len(slots)} time frames for {reg_id}:")

            fare_codes = set()
            for s in slots:
                # Filter for "today" (generic check)
                print(f"      - {s.get('daytimeframe')} {s.get('starttimetimeframe')}-{s.get('endtimetimeframe')} | Code: {s.get('farecalculationcode')}")
                fare_codes.add(s.get('farecalculationcode'))

            # 4. Get Tariffs
            for fc in fare_codes:
                if not fc: continue
                tariffs = fetch(TARIEF_URL, {"areamanagerid": MGR_ID, "farecalculationcode": fc})
                print(f"      - Tariff details for {fc}:")
                for t in tariffs:
                     print(f"        * Start: {t.get('startdatefarepart')} | Amount: {t.get('amountfarepart')} | Step: {t.get('stepsizefarepart')} | Unit: {t.get('unitfarepart')}")

                # 5. Get Desc
                desc = fetch(CALC_URL, {"areamanagerid": MGR_ID, "farecalculationcode": fc})
                if desc:
                    print(f"        * Desc: {desc[0].get('farecalculationdesc')}")

if __name__ == "__main__":
    run()
