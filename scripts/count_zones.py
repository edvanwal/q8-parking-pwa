import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("service-account.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def count_zones():
    zones_ref = db.collection('zones')
    # Use aggregation query if available or just stream keys (lighter)
    docs = zones_ref.select([]).stream() # Select empty to get refs only? Or just stream.

    count = 0
    for _ in docs:
        count += 1

    print(f"Total Zones in Firestore: {count}")

if __name__ == "__main__":
    count_zones()
