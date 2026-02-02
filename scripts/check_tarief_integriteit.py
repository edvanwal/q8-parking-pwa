"""
T1 – Tariefintegriteit (RAPPORT_NPR_RDW_SHPV_PARKERDATA_ANALYSE.md)
Check: zones mogen geen lege rates hebben terwijl price > 0;
       price moet overeenkomen met max uurtarief uit rates (rate_numeric).
Gebruik: python scripts/check_tarief_integriteit.py
         Exit code 0 = ok, 1 = één of meer schendingen (bruikbaar in CI).
"""
import sys
import math

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except ImportError:
    print("firebase_admin required: pip install firebase-admin")
    sys.exit(2)

def main():
    cred = credentials.Certificate("service-account.json")
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(cred)
    db = firestore.client()

    zones_ref = db.collection('zones')
    docs = list(zones_ref.stream())

    violations = []
    count = 0

    for doc in docs:
        count += 1
        d = doc.to_dict()
        zid = doc.id
        price = d.get('price')
        rates = d.get('rates')

        # Geldige price (number)
        if price is not None and not isinstance(price, (int, float)):
            try:
                price = float(price)
            except (TypeError, ValueError):
                violations.append((zid, "price_not_numeric", str(price)))
                continue
        if price is not None and isinstance(price, float) and math.isnan(price):
            violations.append((zid, "price_nan", "NaN"))
            continue

        p = float(price) if price is not None else 0.0

        # Check: price > 0 maar lege of ontbrekende rates
        if p > 0:
            if rates is None or not isinstance(rates, list):
                violations.append((zid, "empty_rates_price_positive", f"price={p} but rates missing or not list"))
                continue
            if len(rates) == 0:
                violations.append((zid, "empty_rates_price_positive", f"price={p} but rates=[]"))

        # Check: price vs max(rate_numeric) uit rates
        if rates and isinstance(rates, list) and len(rates) > 0:
            numerics = []
            for r in rates:
                if isinstance(r, dict) and 'rate_numeric' in r:
                    try:
                        numerics.append(float(r['rate_numeric']))
                    except (TypeError, ValueError):
                        pass
            if numerics:
                max_rate = max(numerics)
                if price is not None and p > 0:
                    if abs(p - max_rate) > 0.02:  # kleine tolerantie voor float
                        violations.append((zid, "price_mismatch_max_rate", f"price={p} max(rate_numeric)={max_rate}"))

    print("--- Tariefintegriteit (T1) ---")
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
