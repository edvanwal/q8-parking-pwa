import firebase_admin
from firebase_admin import credentials, firestore
import json

cred = credentials.Certificate("service-account.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def show(zid):
    doc = db.collection('zones').document(zid).get()
    if doc.exists:
        data = doc.to_dict()
        print(f"\n--- {zid} ---")
        print(f"Name: {data.get('name')}")
        print(f"Price: {data.get('price')}")
        print("Rates:")
        for r in data.get('rates', []):
            print(f"  {r['time']} : {r['price']} ({r.get('detail')})")
    else:
        print(f"\n--- {zid} NOT FOUND ---")

show("363_12100")
show("363_T12B")
show("363_T12B_U11")
