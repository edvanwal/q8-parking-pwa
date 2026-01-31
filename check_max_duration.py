import urllib.request, json, urllib.parse

print("Checking maxdurationright...")
url = "https://opendata.rdw.nl/resource/ixf8-gtwq.json"
params = {"areamanagerid": "599", "$limit": "5000"}
url += "?" + urllib.parse.urlencode(params)

try:
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read().decode('utf-8'))

    found = [d for d in data if int(d.get('maxdurationright', 0)) > 0]
    print(f"Total records: {len(data)}")
    print(f"Non-zero Max Duration records: {len(found)}")
    if found:
        print("Sample:", json.dumps(found[0], indent=2))
    else:
        print("No max duration found in this sample.")

except Exception as e:
    print(f"Error: {e}")
