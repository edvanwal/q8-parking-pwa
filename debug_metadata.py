import urllib.request, json, urllib.parse

# Config
MGR_ID = "599" # Rotterdam
ZONE_ID = "321"

URLS = {
    "AREA": "https://opendata.rdw.nl/resource/b3us-f26s.json",
    "USAGE": "https://opendata.rdw.nl/resource/hz3g-w2u9.json", # Gebruiksdoel
    "REG": "https://opendata.rdw.nl/resource/qtex-qwd8.json",
    "TIME": "https://opendata.rdw.nl/resource/ixf8-gtwq.json",
    "DESC": "https://opendata.rdw.nl/resource/yefi-qfiq.json" # Regulation Desc
}

def fetch(url, params):
    url += "?" + urllib.parse.urlencode(params)
    print(f"Fetching {url}")
    with urllib.request.urlopen(url) as response:
        return json.loads(response.read().decode('utf-8'))

print(f"--- 1. Area Data (Zone {ZONE_ID}) ---")
area_data = fetch(URLS["AREA"], {"areamanagerid": MGR_ID, "areaid": ZONE_ID})
print(json.dumps(area_data, indent=2))

print(f"\n--- 2. Regulation Mapping ---")
mapping = fetch(URLS["REG"], {"areamanagerid": MGR_ID, "areaid": ZONE_ID})
print(json.dumps(mapping, indent=2))

reg_ids = [m['regulationid'] for m in mapping]

print(f"\n--- 3. Regulation Details (Descriptions) ---")
for rid in reg_ids:
    reg_desc = fetch(URLS["DESC"], {"areamanagerid": MGR_ID, "regulationid": rid})
    print(f">> Regulation {rid}:")
    print(json.dumps(reg_desc, indent=2))

    # Also check Usage if linked? (Usually linked via UsageId, but let's check TimeFrames for special days)
    print(f">> Time Frames for {rid} (Check for Special Days/MaxDur):")
    times = fetch(URLS["TIME"], {"areamanagerid": MGR_ID, "regulationid": rid})

    special_days = set()
    for t in times:
         day = t.get('daytimeframe')
         if day not in ["MAANDAG", "DINSDAG", "WOENSDAG", "DONDERDAG", "VRIJDAG", "ZATERDAG", "ZONDAG", "DAGELIJKS"]:
             special_days.add(day)

    print(f"   Special Events found: {special_days}")
