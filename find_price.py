import urllib.request, json
u='https://opendata.rdw.nl/resource/534e-5vdg.json?areamanagerid=344'
with urllib.request.urlopen(u) as r:
    data = json.loads(r.read().decode())
    matches = []
    for d in data:
        amt = float(d.get('amountfarepart', 0))
        step = float(d.get('stepsizefarepart', 1))
        # Rate per hour
        rate = (amt / step) * 60 if step > 0 else 0
        if 6.0 <= rate <= 8.0: # Broad search around 6.98
            matches.append({'code': d.get('farecalculationcode'), 'rate': rate, 'date': d.get('startdatefarepart')})

    # Sort by rate
    matches.sort(key=lambda x: x['rate'])
    for m in matches:
        print(f"Code: {m['code']} | Rate: {m['rate']:.4f} | Date: {m['date']}")
