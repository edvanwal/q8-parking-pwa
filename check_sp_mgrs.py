import urllib.request, json
u='https://opendata.rdw.nl/resource/5754-u6df.json?$limit=1000'
with urllib.request.urlopen(u) as r:
    data = json.loads(r.read().decode())
    mgrs = set(d.get('areamanagerid') for d in data)
    print(f"Unique managers in selling points snippet: {mgrs}")
    # Also find Amsterdam if possible
    for d in data:
        if d.get('areamanagerid') == '363':
            print("FOUND AMSTERDAM")
            break
