import urllib.request, json
import time

MGR = "363"
# TC2 is the code for 6.98/hr.
# We want to find which regulation uses TC2 during the day (e.g. starts at 0900).

TIJDVAK_URL = "https://opendata.rdw.nl/resource/ixf8-gtwq.json"
MAPPING_URL = "https://opendata.rdw.nl/resource/qtex-qwd8.json"

def fetch(url, limit=1000):
    print(f"Fetching {url}")
    with urllib.request.urlopen(f"{url}?areamanagerid={MGR}&$limit={limit}") as r:
        return json.loads(r.read().decode())

def run():
    print("Fetching Time Frames...")
    frames = fetch(TIJDVAK_URL, 50000)

    # 1. Find all Regulation IDs that use 'TC2' between 0900 and 1200
    target_regs = set()
    for f in frames:
        code = f.get('farecalculationcode')
        start = int(f.get('starttimetimeframe', 0))
        end = int(f.get('endtimetimeframe', 0))

        # TC2 usage during day
        if code == 'TC2' and start <= 900 and end >= 1200:
            target_regs.add(f.get('regulationid'))

    print(f"Found {len(target_regs)} regulations using TC2 during day.")
    if len(target_regs) < 20:
        print(target_regs)

    print("Fetching Mappings...")
    mappings = fetch(MAPPING_URL, 50000)

    # 2. Find Areas using these regulations
    candidates = []
    for m in mappings:
        if m.get('regulationid') in target_regs:
            # Check if this area ID looks like 12100
            aid = m.get('areaid')
            if '12100' in aid or 'U11' in aid or 'T12' in aid:
                candidates.append((aid, m.get('regulationid'), m.get('usageid')))

    print("\n--- CANDIDATES ---")
    for c in candidates:
        print(c)

if __name__ == "__main__":
    run()
