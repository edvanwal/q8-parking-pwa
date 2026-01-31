import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("service-account.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def inspect_survivors():
    print("--- Inspecting Amsterdam (363) ---")
    docs_ams = db.collection('zones').where('mgr_id', '==', '363').limit(3).stream()
    for doc in docs_ams:
        d = doc.to_dict()
        print(f"AMS: {d.get('id')} -> Lat: {d.get('lat')}, Lng: {d.get('lng')}")

    print("\n--- Inspecting Rotterdam (599) ---")
    docs_rot = db.collection('zones').where('mgr_id', '==', '599').limit(3).stream()
    for doc in docs_rot:
        d = doc.to_dict()
        print(f"ROT: {d.get('id')} -> Lat: {d.get('lat')}, Lng: {d.get('lng')}")

if __name__ == "__main__":
    inspect_survivors()
