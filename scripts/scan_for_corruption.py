import firebase_admin
from firebase_admin import credentials, firestore
import math

cred = credentials.Certificate("service-account.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def scan_corruption():
    zones_ref = db.collection('zones')
    docs = zones_ref.stream()

    count = 0
    bad_count = 0

    print("--- Scanning for Corruption ---")

    for doc in docs:
        count += 1
        d = doc.to_dict()
        zid = doc.id

        # Check Price
        p = d.get('price')
        if not isinstance(p, (int, float)) or (isinstance(p, float) and math.isnan(p)):
             print(f"BAD PRICE: {zid} -> {p}")
             bad_count += 1
             continue

        # Check Geo
        lat = d.get('lat')
        lng = d.get('lng')

        if not isinstance(lat, (int, float)) or math.isnan(lat):
             print(f"BAD LAT: {zid} -> {lat}")
             bad_count += 1
             continue

        if not isinstance(lng, (int, float)) or math.isnan(lng):
             print(f"BAD LNG: {zid} -> {lng}")
             bad_count += 1
             continue

    print(f"\nTotal Scanned: {count}")
    print(f"Bad Zones: {bad_count}")

if __name__ == "__main__":
    scan_corruption()
