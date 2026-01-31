import urllib.request, json
u='https://opendata.rdw.nl/resource/qtex-qwd8.json?areamanagerid=344'
with urllib.request.urlopen(u) as r:
    data = json.loads(r.read().decode())
    for d in data:
        if d.get('regulationid') == 'REG02':
            print(f"AreaID {d.get('areaid')} maps to REG02")
