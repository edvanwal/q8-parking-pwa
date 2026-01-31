import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("service-account.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def cleanup_zones():
    zones_ref = db.collection('zones')
    docs = zones_ref.stream()

    deleted_count = 0
    checked_count = 0

    print("--- Cleaning up Stale Zones ---")

    batch = db.batch()
    batch_count = 0

    for doc in docs:
        checked_count += 1
        data = doc.to_dict()
        price = data.get('price', 0)

        # NOTE: We can't easily check usageid here unless we kept it in the doc.
        # But 'price == 0' is the main symptom we want to cure.
        # The fetch script NOW excludes 0-price zones, so any existing 0-price zone in DB MUST be stale.
        # (Unless it's a valid free zone? But we decided to filter those globally for now based on user feedback).

        if price == 0:
            print(f"Deleting {doc.id} (Price {price})")
            batch.delete(doc.reference)
            batch_count += 1
            deleted_count += 1

            if batch_count >= 400:
                print("Committing batch...")
                batch.commit()
                batch = db.batch()
                batch_count = 0

    if batch_count > 0:
        print("Committing final batch...")
        batch.commit()

    print(f"\nTotal Scanned: {checked_count}")
    print(f"Deleted: {deleted_count}")

if __name__ == "__main__":
    cleanup_zones()
