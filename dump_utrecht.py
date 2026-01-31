import urllib.request, json
u='https://opendata.rdw.nl/resource/534e-5vdg.json?areamanagerid=344'
with urllib.request.urlopen(u) as r:
    data = json.loads(r.read().decode())
    data.sort(key=lambda x: (x.get('farecalculationcode'), x.get('startdatefarepart')), reverse=True)
    with open('utrecht_rates_dump.txt', 'w') as f:
        for d in data:
            code = d.get('farecalculationcode')
            amt = float(d.get('amountfarepart', 0))
            step = float(d.get('stepsizefarepart', 1))
            rate = (amt/step)*60
            date = d.get('startdatefarepart')
            f.write(f"Code: {code} | Rate: {rate:.4f} | Amt: {amt} | Step: {step} | Date: {date}\n")
print("Dumped.")
