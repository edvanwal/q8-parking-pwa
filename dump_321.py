
import firebase_admin
from firebase_admin import credentials, firestore
import json

cred = credentials.Certificate("service-account.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# Try to find zone 321. ID could be "344_321" or just "321" or "321" with another prefix
print("Searching for zone 321...")

docs = db.collection('zones').get()
found = False
for doc in docs:
    d = doc.to_dict()
    # Check ID or Name
    if "321" in str(d.get('id', '')) or "321" in str(d.get('name', '')):
        print(f"\nFOUND MATCH: ID={doc.id}")
        # print(json.dumps(d['rates'], indent=2))
        for r in d['rates']:
             print(f"Time: {r['time']}")
             print(f"Price: {r['price']}")
             print(f"Detail: {r['detail']}")
             print("-" * 20)
        found = True

if not found:
    print("No zone 321 found.")
