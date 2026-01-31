import os
import json
import urllib.request
import urllib.error
import sys

# Robuuste padbepaling
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
DATA_DIR = os.path.join(PROJECT_ROOT, "data", "raw")

# RDW Dataset Config (SODA Resource API)
# URL pattern: https://opendata.rdw.nl/resource/<id>.json
DATASETS = {
    "gebied.json": {
        "id": "adw6-9hsg",
        "fields": "areamanagerid,areaid"
    },
    # GEEN $select -> voorkomt HTTP 400 door onzekere kolomnamen
    "regeling.json": {
        "id": "yefi-qfiq",
        "fields": None
    },
    # GEEN $select -> voorkomt HTTP 400
    "tijdvak.json": {
        "id": "ixf8-gtwq",
        "fields": None
    },
    "tariefdeel.json": {
        "id": "534e-5vdg",
        "fields": "areamanagerid,farecalculationcode,amountfarepart,stepsizefarepart,startdurationfarepart"
    },
    "tariefberekening.json": {
        "id": "nfzq-8g7y",
        # Alles ophalen: nodig voor tekstuele DayPass-detectie
        "fields": None
    }
}

LIMIT = 10000  # Ruim voldoende voor demo-intersecties

def fetch_data():
    print(f"Checking data directory: {DATA_DIR}")
    if not os.path.exists(DATA_DIR):
        try:
            os.makedirs(DATA_DIR)
            print("Created data/raw directory.")
        except OSError as e:
            print(f"[ERROR] Cannot create directory {DATA_DIR}: {e}")
            sys.exit(1)

    for filename, config in DATASETS.items():
        filepath = os.path.join(DATA_DIR, filename)

        # Cache check
        if os.path.exists(filepath):
            print(f"[CACHE] {filename} already exists. Skipping download.")
            continue

        # Build query params
        query_params = [f"$limit={LIMIT}"]
        if config["fields"]:
            query_params.append(f"$select={config['fields']}")

        url = f"https://opendata.rdw.nl/resource/{config['id']}.json?" + "&".join(query_params)

        print(f"[DOWNLOADING] {filename}")
        print(f"   URL: {url}")

        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=30) as response:
                content = response.read().decode("utf-8")

                try:
                    data = json.loads(content)
                except json.JSONDecodeError:
                    print(f"   -> FAILED: Invalid JSON received for {filename}")
                    continue

                if not isinstance(data, list):
                    print(f"   -> WARNING: Expected JSON array, got {type(data)}")

                with open(filepath, "w", encoding="utf-8") as f:
                    json.dump(data, f)

                print(f"   -> Success! Saved {len(data)} records to {filename}")

        except urllib.error.HTTPError as e:
            print(f"   -> FAILED to download {filename}: HTTP {e.code} {e.reason}")
        except urllib.error.URLError as e:
            print(f"   -> FAILED to download {filename}: {e.reason}")
        except Exception as e:
            print(f"   -> UNEXPECTED ERROR for {filename}: {e}")

if __name__ == "__main__":
    fetch_data()
