import urllib.request, json
u='https://opendata.rdw.nl/resource/b3us-f26s.json?areamanagerid=363'
with urllib.request.urlopen(u) as r:
    data = json.loads(r.read().decode())
    if data:
        print(f"Keys: {list(data[0].keys())}")
        # Print a few examples
        for d in data[:3]:
            print(f"ID: {d.get('areaid')} | Desc: {d.get('areadesc')}")
