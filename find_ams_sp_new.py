import urllib.request, json
u='https://opendata.rdw.nl/resource/7sc9-99id.json?$limit=1000'
with urllib.request.urlopen(u) as r:
    data = json.loads(r.read().decode())
    for d in data:
        sp_id = d.get('sellingpointid', '')
        if '12100' in str(sp_id):
            print(json.dumps(d, indent=2))
