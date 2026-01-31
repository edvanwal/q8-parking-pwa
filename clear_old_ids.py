import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("service-account.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

print("Deleting numeric-only IDs...")
docs = db.collection('zones').get()
count = 0
for doc in docs:
    if doc.id.isdigit():
        doc.reference.delete()
        count += 1
print(f"Deleted {count} documents.")
