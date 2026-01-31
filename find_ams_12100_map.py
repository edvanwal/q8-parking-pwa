import urllib.request, json, urllib.parse
mgr = "363"
params = urllib.parse.urlencode({"areamanagerid": mgr, "$limit": 10000})
u = f"https://opendata.rdw.nl/resource/qtex-qwd8.json?{params}"
print(f"Checking {u}...")
with urllib.request.urlopen(u) as r:
    data = json.loads(r.read().decode())
    matches = [d for d in data if '12100' in d.get('areaid', '')]
    if matches:
        print(json.dumps(matches, indent=2))
    else:
        print("No matches for 12100 in Amsterdam mapping.")
        # Print a few examples of Amsterdam AreaIDs
        print("Expert IDs:", [d.get('areaid') for d in data[:5]])
