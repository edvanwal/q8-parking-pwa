import urllib.request, json, urllib.parse

# Config
MGR_ID = "599" # Rotterdam
ZONE_ID = "321"

TIJDVAK_URL = "https://opendata.rdw.nl/resource/ixf8-gtwq.json"
TARIEFDEEL_URL = "https://opendata.rdw.nl/resource/534e-5vdg.json"
DESC_URL = "https://opendata.rdw.nl/resource/yefi-qfiq.json"
CALC_URL = "https://opendata.rdw.nl/resource/nfzq-8g7y.json"
MAPPING_URL = "https://opendata.rdw.nl/resource/qtex-qwd8.json"

def fetch(url, params=None):
    if params: url += "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url) as response:
        return json.loads(response.read().decode('utf-8'))

print("--- Searching for Rate 3.20 in Rotterdam ---")
all_tariffs = fetch(TARIEFDEEL_URL, {"areamanagerid": MGR_ID, "$limit": 10000})

found_codes = {}
for t in all_tariffs:
    d = t.get('startdatefarepart', '0')
    if d > "20260201": continue

    amt = float(t.get('amountfarepart', 0))
    step = float(t.get('stepsizefarepart', 1))
    rate = (amt/step)*60 if step > 0 else 0
    if abs(rate - 3.20) < 0.05:
        # Found it!
        code = t.get('farecalculationcode')
        # Store latest date only
        if code not in found_codes or d > found_codes[code]['date']:
            found_codes[code] = {'rate': rate, 'date': d}

print(f"Codes matching ~3.20: {found_codes.keys()}")

print(f"\n--- Detailed Schedule for Zone {ZONE_ID} ---")
mapping = fetch(MAPPING_URL, {"areamanagerid": MGR_ID, "areaid": ZONE_ID})
reg_ids = [m['regulationid'] for m in mapping]

slots = []
for rid in reg_ids:
    s = fetch(TIJDVAK_URL, {"areamanagerid": MGR_ID, "regulationid": rid})
    for slot in s:
        code = slot.get('farecalculationcode')
        day_ = slot.get('daytimeframe')
        start_ = slot.get('starttimetimeframe')
        end_ = slot.get('endtimetimeframe')

        # Get Desc for code
        desc_data = fetch(CALC_URL, {"areamanagerid": MGR_ID, "farecalculationcode": code})
        desc = desc_data[0]['farecalculationdesc'] if desc_data else "??"

        print(f"Reg {rid} | {day_} {start_}-{end_} | Code: {code} ({desc})")
