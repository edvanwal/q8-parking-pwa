import urllib.request, json
u='https://opendata.rdw.nl/resource/b3us-f26s.json?areamanagerid=363&$limit=5000'
with urllib.request.urlopen(u) as r:
    data = json.loads(r.read().decode())
    for d in data:
        print(f"ID: {d.get('areaid')} | Desc: {d.get('areadesc')}")
