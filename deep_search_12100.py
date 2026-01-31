import urllib.request, json
urls = [
    "https://opendata.rdw.nl/resource/b3us-f26s.json", # Specs
    "https://opendata.rdw.nl/resource/qtex-qwd8.json", # Mapping
    "https://opendata.rdw.nl/resource/ixf8-gtwq.json", # Time slots
    "https://opendata.rdw.nl/resource/534e-5vdg.json", # Rates
]

for url in urls:
    full_url = f"{url}?$limit=10000"
    print(f"Checking {url}...")
    try:
        with urllib.request.urlopen(full_url) as r:
            data = json.loads(r.read().decode())
            for d in data:
                if '12100' in str(d):
                    print(f"MATCH in {url}: {json.dumps(d)}")
    except Exception as e:
        print(f"Error {url}: {e}")
