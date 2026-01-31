import urllib.request
import json

def search_dataset(dataset_id, name, query_func):

    url = f"https://opendata.rdw.nl/resource/{dataset_id}.json?$limit=50000"
    print(f"--- Searching {name} ({dataset_id}) ---")
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode("utf-8"))
            matches = [d for d in data if query_func(d)]
            if matches:
                print(f"Found {len(matches)} matches.")
                print("First match sample:")
                print(json.dumps(matches[0], indent=2))
            else:
                print("No matches found.")
    except Exception as e:
        print(f"Error: {e}")
    print("\n")

# Search for '321' in areaid
search_dataset("t5pc-eb34", "Geometry (t5pc-eb34) - '321' in areaid", lambda d: '321' in d.get('areaid', ''))

# Search for '599' in areaid
search_dataset("t5pc-eb34", "Geometry (t5pc-eb34) - '599' in areaid", lambda d: '599' in d.get('areaid', ''))
