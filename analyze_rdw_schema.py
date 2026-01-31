import urllib.request, json, urllib.parse

# Datasets to inspect
URLS = {
    "AREA (b3us-f26s)": "https://opendata.rdw.nl/resource/b3us-f26s.json",
    "USAGE (hz3g-w2u9)": "https://opendata.rdw.nl/resource/hz3g-w2u9.json",
    "REGULATION (qtex-qwd8)": "https://opendata.rdw.nl/resource/qtex-qwd8.json",
    "TIME (ixf8-gtwq)": "https://opendata.rdw.nl/resource/ixf8-gtwq.json",
    "TARIFF (534e-5vdg)": "https://opendata.rdw.nl/resource/534e-5vdg.json",
    "CALC (nfzq-8g7y)": "https://opendata.rdw.nl/resource/nfzq-8g7y.json",
    "DESC (yefi-qfiq)": "https://opendata.rdw.nl/resource/yefi-qfiq.json"
}

MGR_ID = "599" # Rotterdam (Focus)

def fetch(url):
    # Fetch a good sample (100 items) for Rotterdam to see populated fields
    u = url + "?" + urllib.parse.urlencode({"areamanagerid": MGR_ID, "$limit": 100})
    try:
        with urllib.request.urlopen(u) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return []

print("--- RDW Schema Analysis ---")

for name, url in URLS.items():
    print(f"\ndataset: {name}")
    data = fetch(url)
    if not data:
        print("  (No data found)")
        continue

    # Collect all unique keys across the sample
    all_keys = set()
    sample_vals = {}

    for item in data:
        for k, v in item.items():
            all_keys.add(k)
            if k not in sample_vals and v: # Store non-empty sample
                sample_vals[k] = v

    # Print Keys and Sample
    sorted_keys = sorted(list(all_keys))
    for k in sorted_keys:
        val = sample_vals.get(k, "[Empty]")
        print(f"  - {k}: {val}")
