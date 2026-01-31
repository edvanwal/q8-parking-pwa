import urllib.request, json
u='https://opendata.rdw.nl/resource/b3us-f26s.json?areamanagerid=363'
with urllib.request.urlopen(u) as r:
    data = json.loads(r.read().decode())
    for d in data:
        desc = d.get('areadesc', '')
        if '121' in desc:
            print(f"AreaID: {d.get('areaid')} | Desc: {desc}")
