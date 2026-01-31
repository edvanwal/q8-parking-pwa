import urllib.request, json
u='https://opendata.rdw.nl/resource/534e-5vdg.json?$limit=50000'
with urllib.request.urlopen(u) as r:
    data = json.loads(r.read().decode())
    for d in data:
        try:
            amt = float(d.get('amountfarepart', 0))
            step = float(d.get('stepsizefarepart', 1))
            rate = (amt/step)*60
            if 6.97 <= rate <= 6.99:
                print(f"MGR: {d.get('areamanagerid')} | Code: {d.get('farecalculationcode')} | Rate: {rate:.4f} | Date: {d.get('startdatefarepart')}")
        except: pass
