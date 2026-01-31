import firebase_admin
from firebase_admin import credentials, firestore

# Init without error if already init
try:
    cred = credentials.Certificate("service-account.json")
    firebase_admin.initialize_app(cred)
except ValueError:
    pass

db = firestore.client()

doc_ref = db.collection('zones').document('599_321')
doc = doc_ref.get()

if doc.exists:
    data = doc.to_dict()
    print("--- Zone 321 Data ---")
    rates = data.get('rates', [])
    print(f"Rates Count: {len(rates)}")
    if rates:
        # Check first few rates for the new format
        for i, r in enumerate(rates[:3]):
             print(f"Rate {i}: {r.get('price')} | Detail: {r.get('detail')}")

    print(f"Max Duration: {data.get('max_duration_mins')}")
    print(f"Special Rules: {data.get('has_special_rules')}")
else:
    print("Zone 599_321 not found!")
