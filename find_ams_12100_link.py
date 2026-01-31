import urllib.request, json
# Search for '12100' in selling points and descriptions for Amsterdam (363)
mgr = "363"
urls = [
    f"https://opendata.rdw.nl/resource/5754-u6df.json?areamanagerid={mgr}", # Selling points
    f"https://opendata.rdw.nl/resource/yefi-qfiq.json?areamanagerid={mgr}", # Regulations
    f"https://opendata.rdw.nl/resource/b3us-f26s.json?areamanagerid={mgr}"  # Area specs
]

for url in urls:
    print(f"Checking {url}...")
    try:
        with urllib.request.urlopen(url) as r:
            data = json.loads(r.read().decode())
            for d in data:
                if '12100' in str(d):
                    print(f"MATCH: {json.dumps(d)}")
    except Exception as e:
        print(f"Error: {e}")
