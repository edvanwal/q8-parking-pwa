#!/usr/bin/env python3
"""
Enrich parking zones with street addresses using Nominatim reverse geocoding.
This script reads zones from Firestore, fetches addresses for each zone,
and updates the zones with street + house number data.

Usage: python scripts/enrich_zones_with_addresses.py
"""

import os
import glob
import requests
import time
import json
import firebase_admin
from firebase_admin import credentials, firestore

# Rate limit: 1 request per second for Nominatim
NOMINATIM_DELAY = 1.1  # seconds between requests


def find_service_account_key():
    """Find Firebase service account key: serviceAccountKey.json or *adminsdk*.json in project root."""
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    path1 = os.path.join(root, "serviceAccountKey.json")
    if os.path.isfile(path1):
        return path1
    for path in glob.glob(os.path.join(root, "*adminsdk*.json")):
        if os.path.isfile(path):
            return path
    return None


def reverse_geocode(lat, lon):
    """
    Convert lat/lng to street address using Nominatim (OpenStreetMap).
    Returns dict with street, houseNumber, city, postcode.
    """
    url = "https://nominatim.openstreetmap.org/reverse"
    params = {
        "lat": lat,
        "lon": lon,
        "format": "json",
        "addressdetails": 1,
        "accept-language": "nl",
        "zoom": 18  # Street-level detail
    }
    headers = {
        "User-Agent": "Q8ParkingApp/1.0 (parking zone enrichment)"
    }

    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()

        address = data.get("address", {})

        # Extract street name (try multiple fields)
        street = (
            address.get("road") or
            address.get("pedestrian") or
            address.get("footway") or
            address.get("street") or
            address.get("path") or
            ""
        )

        # Extract house number
        house_number = address.get("house_number", "")

        # Extract city (try multiple fields)
        city = (
            address.get("city") or
            address.get("town") or
            address.get("village") or
            address.get("municipality") or
            ""
        )

        # Extract postcode
        postcode = address.get("postcode", "")

        return {
            "street": street,
            "houseNumber": house_number,
            "city": city,
            "postcode": postcode,
            "display_name": data.get("display_name", "")
        }

    except Exception as e:
        print(f"  Error geocoding ({lat}, {lon}): {e}")
        return None


def init_firebase():
    """Initialize Firebase Admin SDK."""
    try:
        return firestore.client()
    except Exception:
        pass

    key_path = find_service_account_key()
    if not key_path:
        print("No service account key found. Place serviceAccountKey.json or")
        print("q8-parking-pwa-firebase-adminsdk-*.json in the project root.")
        return None

    try:
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)
        print(f"Using key: {os.path.basename(key_path)}\n")
        return firestore.client()
    except Exception as e:
        print(f"Firebase init error: {e}")
        return None


def enrich_zones():
    """Main function to enrich all zones with address data."""
    print("=" * 60)
    print("Zone Address Enrichment Script")
    print("=" * 60)

    # Initialize Firestore
    db = init_firebase()
    if not db:
        print("\nCannot connect to Firestore. Running in test mode with local JSON...")
        return enrich_local_json()

    # Fetch all zones
    print("\nFetching zones from Firestore...")
    zones_ref = db.collection("zones")
    zones = list(zones_ref.stream())
    total = len(zones)
    print(f"Found {total} zones\n")

    # Track statistics
    updated = 0
    skipped = 0
    errors = 0

    for i, zone_doc in enumerate(zones):
        zone = zone_doc.to_dict()
        zone_id = zone.get("id", zone_doc.id)

        # Check if already has address
        if zone.get("street") and zone.get("city"):
            print(f"[{i+1}/{total}] {zone_id} - Already has address, skipping")
            skipped += 1
            continue

        lat = zone.get("lat")
        lng = zone.get("lng")

        if not lat or not lng:
            print(f"[{i+1}/{total}] {zone_id} - No coordinates, skipping")
            skipped += 1
            continue

        print(f"[{i+1}/{total}] {zone_id} - Geocoding ({lat}, {lng})...")

        # Rate limit
        time.sleep(NOMINATIM_DELAY)

        # Get address
        address = reverse_geocode(lat, lng)

        if address and address.get("street"):
            # Update Firestore
            update_data = {
                "street": address["street"],
                "houseNumber": address["houseNumber"],
                "postcode": address["postcode"]
            }

            # Only update city if we got a better one
            if address["city"] and not zone.get("city"):
                update_data["city"] = address["city"]

            zones_ref.document(zone_doc.id).update(update_data)

            addr_str = f"{address['street']} {address['houseNumber']}".strip()
            print(f"         -> {addr_str}, {address['city']}")
            updated += 1
        else:
            print(f"         -> No address found")
            errors += 1

    # Print summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total zones: {total}")
    print(f"Updated:     {updated}")
    print(f"Skipped:     {skipped}")
    print(f"Errors:      {errors}")
    print("=" * 60)


def enrich_local_json():
    """Fallback: Enrich local JSON file for testing."""
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_file = os.path.join(root, "data", "parking_zones.json")
    output_file = os.path.join(root, "data", "parking_zones_enriched.json")

    print(f"\nReading {input_file}...")

    try:
        with open(input_file, "r", encoding="utf-8") as f:
            zones = json.load(f)
    except FileNotFoundError:
        print(f"File not found: {input_file}")
        return

    total = len(zones)
    print(f"Found {total} zones\n")

    # Only process first 10 as demo (to avoid rate limits)
    demo_limit = 10
    print(f"Demo mode: processing first {demo_limit} zones\n")

    for i, zone in enumerate(zones[:demo_limit]):
        zone_id = zone.get("id", "unknown")
        lat = zone.get("lat")
        lng = zone.get("lng")

        if not lat or not lng:
            print(f"[{i+1}/{demo_limit}] {zone_id} - No coordinates, skipping")
            continue

        print(f"[{i+1}/{demo_limit}] {zone_id} - Geocoding ({lat}, {lng})...")

        time.sleep(NOMINATIM_DELAY)

        address = reverse_geocode(lat, lng)

        if address and address.get("street"):
            zone["street"] = address["street"]
            zone["houseNumber"] = address["houseNumber"]
            if not zone.get("city"):
                zone["city"] = address["city"]
            zone["postcode"] = address["postcode"]

            addr_str = f"{address['street']} {address['houseNumber']}".strip()
            print(f"         -> {addr_str}, {address['city']}")
        else:
            print(f"         -> No address found")

    # Save enriched data
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(zones, f, indent=2, ensure_ascii=False)

    print(f"\nSaved enriched zones to {output_file}")


if __name__ == "__main__":
    enrich_zones()
