"""
D1 / T1 – Tariefintegriteit (RAPPORT_DATABRONNEN_VARIABELEN_PLAN.md, RAPPORT_NPR_RDW_SHPV_PARKERDATA_ANALYSE.md)
Check: zones mogen geen lege rates hebben terwijl price > 0;
       price moet overeenkomen met max uurtarief uit rates (rate_numeric).
Gebruik: python scripts/check_tarief_integriteit.py [--firestore]
         Exit code 0 = ok, 1 = één of meer schendingen (bruikbaar in CI).
         Zonder --firestore: geen check (alleen --help). Met --firestore: leest zones uit Firestore.
"""
import argparse
import os
import sys
import math

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except ImportError:
    print("firebase_admin required: pip install firebase-admin")
    sys.exit(2)

# Tolerantie voor float-vergelijking price vs max(rate_numeric)
PRICE_TOLERANCE = 0.02


def check_zone_integrity(zid, d):
    """Controleer één zone; retourneer lijst van (zid, code, msg)."""
    violations = []
    price = d.get("price")
    rates = d.get("rates")

    if price is not None and not isinstance(price, (int, float)):
        try:
            price = float(price)
        except (TypeError, ValueError):
            violations.append((zid, "price_not_numeric", str(price)))
            return violations
    if price is not None and isinstance(price, float) and math.isnan(price):
        violations.append((zid, "price_nan", "NaN"))
        return violations

    p = float(price) if price is not None else 0.0

    if p > 0:
        if rates is None or not isinstance(rates, list):
            violations.append((zid, "empty_rates_price_positive", f"price={p} but rates missing or not list"))
            return violations
        if len(rates) == 0:
            violations.append((zid, "empty_rates_price_positive", f"price={p} but rates=[]"))

    if rates and isinstance(rates, list) and len(rates) > 0:
        numerics = []
        for r in rates:
            if isinstance(r, dict) and "rate_numeric" in r:
                try:
                    numerics.append(float(r["rate_numeric"]))
                except (TypeError, ValueError):
                    pass
        if numerics:
            max_rate = max(numerics)
            if price is not None and p > 0 and abs(p - max_rate) > PRICE_TOLERANCE:
                violations.append((zid, "price_mismatch_max_rate", f"price={p} max(rate_numeric)={max_rate}"))

    return violations


def main():
    parser = argparse.ArgumentParser(description="D1 Tariefintegriteit: check zones in Firestore")
    parser.add_argument("--firestore", action="store_true", help="Run check against Firestore (default if no other source)")
    args = parser.parse_args()

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cred_path = os.path.join(root, "service-account.json")
    if not os.path.isfile(cred_path):
        cred_path = os.path.join(root, "q8-parking-pwa-firebase-adminsdk-fbsvc-9e50406bcb.json")
    if not os.path.isfile(cred_path):
        print("Firebase credentials not found. Run from project root with service-account.json.", file=sys.stderr)
        sys.exit(2)

    cred = credentials.Certificate(cred_path)
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(cred)
    db = firestore.client()

    zones_ref = db.collection("zones")
    docs = list(zones_ref.stream())

    violations = []
    for doc in docs:
        d = doc.to_dict()
        zid = doc.id
        violations.extend(check_zone_integrity(zid, d))

    count = len(docs)
    print("--- Tariefintegriteit (D1) ---")
    print(f"Zones gescand: {count}")
    print(f"Schendingen: {len(violations)}")
    for zid, code, msg in violations:
        print(f"  [{zid}] {code}: {msg}")

    if violations:
        sys.exit(1)
    print("OK")
    sys.exit(0)

if __name__ == "__main__":
    main()
