import firebase_admin
from firebase_admin import credentials, firestore

def find_zero_price_zones():
    cred = credentials.Certificate("service-account.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()

    print("Checking for zero-price zones in Firestore...")
    zones_ref = db.collection('zones')
    docs = zones_ref.stream()

    zero_price_count = 0
    total_count = 0
    zero_price_list = []

    for doc in docs:
        total_count += 1
        data = doc.to_dict()
        price = data.get('price', 0)

        if price == 0:
            zero_price_count += 1
            zero_price_list.append(f"{data.get('city')} - {data.get('id')} ({data.get('name')})")

    print(f"\n📊 Summary:")
    print(f"Total Zones: {total_count}")
    print(f"Zero Price Zones: {zero_price_count}")

    if zero_price_count > 0:
        print("\n🔍 Sample of Zero-Price Zones:")
        for z in zero_price_list[:10]:
            print(f"  - {z}")
        if zero_price_count > 10:
            print(f"  ... and {zero_price_count - 10} more.")
    else:
        print("\n✅ No zero-price zones found in active collection.")

if __name__ == "__main__":
    find_zero_price_zones()
