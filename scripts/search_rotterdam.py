import urllib.request
import json
import ssl

# Bypass SSL verification if needed (sometimes helps with corporate proxies or weird certs)
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def fetch_url(url, description):
    print(f"--- {description} ---")
    print(f"URL: {url}")
    try:
        with urllib.request.urlopen(url, context=ctx) as response:
            data = json.loads(response.read().decode("utf-8"))
            if data:
                print(f"Found {len(data)} records.")
                print("First record:")
                print(json.dumps(data[0], indent=2))
            else:
                print("No records found.")
    except Exception as e:
        print(f"Error: {e}")
    print("\n")

# Search 'b3us-f26s' for Rotterdam (599)
fetch_url("https://opendata.rdw.nl/resource/b3us-f26s.json?areamanagerid=599&$limit=5", "Rotterdam Specs (b3us-f26s)")
