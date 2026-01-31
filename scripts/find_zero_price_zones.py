import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("service-account.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def find_zero_prices():
    zones_ref = db.collection('zones')
    # Fetch all docs (might be large, but needed for 0 check)
    docs = zones_ref.stream()

    count = 0
    zero_count = 0

    print("--- Zones with Price 0 ---")

    for doc in docs:
        count += 1
        data = doc.to_dict()
        price = data.get('price', 0)

        if price == 0:
            zero_count += 1
            zid = doc.id
            name = data.get('name', 'Unknown')
            city = data.get('city', 'Unknown')
            print(f"[{zid}] {city} - {name} : € {price}")

    print(f"\nTotal Zones: {count}")
    print(f"Zero Price Zones: {zero_count}")

if __name__ == "__main__":
    find_zero_prices()
