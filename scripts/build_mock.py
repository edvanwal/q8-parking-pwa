import os
import json
import sys
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
RAW_DIR = os.path.join(PROJECT_ROOT, "data", "raw")
PROCESSED_DIR = os.path.join(PROJECT_ROOT, "data", "processed")
OUTPUT_FILE = os.path.join(PROCESSED_DIR, "mock_parking.json")

def load_json(filename):
    path = os.path.join(RAW_DIR, filename)
    if not os.path.exists(path):
        print(f"[ERROR] Missing file: {filename}")
        sys.exit(1)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def safe_int(v, default=0):
    try:
        return int(float(v))
    except:
        return default

def safe_float(v, default=0.0):
    try:
        return float(v)
    except:
        return default

def parse_time_any(row, keys):
    for k in keys:
        if k in row and row[k]:
            t = str(row[k]).zfill(4)
            return f"{t[:2]}:{t[2:]}"
    return None

def build():
    tijdvakken = load_json("tijdvak.json")
    tariefdelen = load_json("tariefdeel.json")
    tariefberekeningen = load_json("tariefberekening.json")

    zones = [
        {
            "zoneId": "10000",
            "city": "Amsterdam",
            "lat": 52.3676,
            "lng": 4.9041,
            "streets": ["Kalverstraat", "Damrak", "Leidsestraat", "Rokin"]
        },
        {
            "zoneId": "20000",
            "city": "Utrecht",
            "lat": 52.0907,
            "lng": 5.1214,
            "streets": ["Oudegracht", "Vredenburg", "Lange Viestraat", "Steenweg"]
        },
        {
            "zoneId": "30000",
            "city": "Den Haag",
            "lat": 52.0705,
            "lng": 4.3007,
            "streets": ["Spui", "Grote Markt", "Hofweg", "Lange Poten"]
        }
    ]

    output_zones = []

    for zone in zones:
        blocks = []
        is_day_pass = False

        for tv in tijdvakken[:200]:  # bewust beperken
            start = parse_time_any(tv, ["starttime", "start_time", "starttijd"])
            end = parse_time_any(tv, ["endtime", "end_time", "eindtijd"])

            if not start or not end:
                continue

            fcc = tv.get("farecalculationcode")
            prijs = 0.0
            step = 60

            for td in tariefdelen:
                if td.get("farecalculationcode") == fcc:
                    prijs = safe_float(td.get("amountfarepart"))
                    step = safe_int(td.get("stepsizefarepart"), 60)
                    break

            blocks.append({
                "start": start,
                "end": end,
                "pricePerHour": round(prijs * (60 / step), 2) if step else 0,
                "stepMinutes": step
            })

            if step >= 240:
                is_day_pass = True

        if not blocks:
            blocks = [
                {"start": "00:00", "end": "08:00", "pricePerHour": 0.0, "stepMinutes": 0},
                {"start": "08:00", "end": "18:00", "pricePerHour": 2.5, "stepMinutes": 30},
                {"start": "18:00", "end": "23:59", "pricePerHour": 0.0, "stepMinutes": 0},
            ]

        # Pick a random street for display purposes in search results
        import random
        demo_street = random.choice(zone["streets"])

        output_zones.append({
            "zoneId": zone["zoneId"],
            "city": zone["city"],
            "lat": zone["lat"],
            "lng": zone["lng"],
            "street": demo_street, # For search by address
            "zipCode": f"{zone['zoneId'][:4]} AB", # Fake zip
            "source": {"strategy": "synthetic-zone-from-rdw"},
            "isDayPass": is_day_pass,
            "maxDurationMinutes": 1440 if is_day_pass else None,
            "timeBlocks": blocks[:3]
        })

    if not os.path.exists(PROCESSED_DIR):
        os.makedirs(PROCESSED_DIR)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump({"zones": output_zones}, f, indent=2)

    print(f"[OK] Generated {OUTPUT_FILE}")

if __name__ == "__main__":
    build()
