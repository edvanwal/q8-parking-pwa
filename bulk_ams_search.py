import urllib.request, json
u='https://opendata.rdw.nl/resource/b3us-f26s.json?areamanagerid=363&$limit=1000'
with urllib.request.urlopen(u) as r:
    data = json.loads(r.read().decode())
    for d in data:
        if '121' in str(d):
            print(f"MATCH: {d.get('areaid')}")
print(f"Total checked: {len(data)}")
