import urllib.request, json, urllib.parse, os, sys
from datetime import datetime, timezone
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
import google.generativeai as genai
import time

load_dotenv()

# --- Config ---
# Zie docs/RDW_DATASETS_VARIABELEN_EN_KOPPELVELDEN.md voor alle resource-IDs en uitbreiding gemeenten (sectie 9).
MAPPING_URL = "https://opendata.rdw.nl/resource/qtex-qwd8.json"
TIJDVAK_URL = "https://opendata.rdw.nl/resource/ixf8-gtwq.json"
TARIEFDEEL_URL = "https://opendata.rdw.nl/resource/534e-5vdg.json"
DESC_URL = "https://opendata.rdw.nl/resource/yefi-qfiq.json"
CALC_URL = "https://opendata.rdw.nl/resource/nfzq-8g7y.json"
AREAS_URL = "https://opendata.rdw.nl/resource/b3us-f26s.json"

# Optioneel: alleen nu geldige regelingen ophalen (minder payload). Zet RDW_USE_DATE_FILTER=1 in omgeving.
# Volledig "incrementeel" (alleen gewijzigde records) vereist last_modified van RDW; nu: full fetch, updated_at = run-timestamp.
USE_DATE_FILTER = os.environ.get("RDW_USE_DATE_FILTER", "").strip().lower() in ("1", "true", "yes")

TARGET_CITIES = {
    "363": "Amsterdam", "599": "Rotterdam", "518": "Den Haag",
    "344": "Utrecht", "268": "Nijmegen", "307": "Amersfoort"
}

ALIASES = {
    "363_T12B": "12100",
}

# --- LLM Setup ---
API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel('gemini-2.0-flash')
else:
    print("WARNING: No GEMINI_API_KEY found in .env. LLM translation will be skipped.")
    model = None

CACHE_FILE = "translation_cache.json"
TRANSLATION_CACHE = {}

def load_cache():
    global TRANSLATION_CACHE
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                TRANSLATION_CACHE = json.load(f)
        except Exception as e:
            print(f"Error loading cache: {e}")

def save_cache():
    try:
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(TRANSLATION_CACHE, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving cache: {e}")

def translate_desc_llm(text, current_rate):
    """
    Translates Dutch parking tariff descriptions to specific English format using Gemini.
    """
    if not text: return None
    if not model: return text # Fallback if no key

    # Check Cache
    cache_key = f"{text}|{current_rate}"
    if cache_key in TRANSLATION_CACHE:
        return TRANSLATION_CACHE[cache_key]

    # Prompt
    prompt = f"""
    You are a helpful assistant for a parking app.
    Translate the following Dutch parking tariff description into a specific English format.

    Context:
    - The 'Current Hourly Rate' for this block is: € {current_rate:.2f}
    - The input text describes specific rules like "Start tariffs" (Stop & Shop) or "Step sizes".

    Rules:
    1. If the text mentions "stappen van X min" (steps of X min), output: "€ {current_rate:.2f}/h > payment per X minutes"
    2. If the text mentions "Stop en Shop" or "eerste X min Y...", output: "€ [Price] for the first [X] minutes. € {current_rate:.2f} per hour after [X] minutes".
       (Note: The 'after' price should be the Current Hourly Rate provided above).
    3. If the text is generic or just repeats the rate, output it simply as "€ {current_rate:.2f} per hour".
    4. Keep it concise. No markdown, no explanations. Just the final string.

    Input Dutch: "{text}"
    Output English:
    """

    try:
        response = model.generate_content(prompt)
        result = response.text.strip()
        # Clean up quotes if model added them
        result = result.replace('"', '').replace("'", "")

        # Save to cache
        TRANSLATION_CACHE[cache_key] = result
        save_cache()
        # time.sleep(4) - Removed for Paid Tier
        return result
    except Exception as e:
        print(f"LLM Error: {e}")
        # FALLBACK: Regex Logic
        import re
        if "stappen van" in text:
            match = re.search(r"stappen van (\d+) min", text)
            if match:
                mins = match.group(1)
                return f"\u20ac {current_rate:.2f}/h > payment per {mins} minutes"
        if "Stop en Shop" in text:
             match = re.search(r"eerste (\d+)min ([\d,]+)", text)
             if match:
                 mins = match.group(1)
                 price = match.group(2).replace(',', '.')
                 return f"\u20ac {price} for the first {mins} minutes. \u20ac {current_rate:.2f} per hour after {mins} minutes"
        return text # Ultimate fallback

# --- Fetch Logic ---

def fetch_json(url, params=None):
    if params:
        url += "?" + urllib.parse.urlencode(params)
    print(f"  Requesting: {url}")
    with urllib.request.urlopen(url) as response:
        return json.loads(response.read().decode('utf-8'))

def run_update():
    load_cache() # Init cache

    cred = credentials.Certificate("service-account.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()

    print("Fetching RDW data...")
    reference_date = datetime.now().strftime("%Y%m%d")  # voor optionele datumfilter (D2)

    # 1. Fetch Zones (Specs)
    zones_raw = []
    for mgr in TARGET_CITIES:
        zones_raw.extend(fetch_json(AREAS_URL, {"areamanagerid": mgr, "$limit": 5000}))

    # 2. Mappings (optioneel: alleen regelingen die nu geldig zijn: enddate null of >= vandaag)
    mapping_raw = []
    mapping_params_base = {"$limit": 5000}
    if USE_DATE_FILTER:
        mapping_params_base["$where"] = (
            "enddatearearegulation is null or enddatearearegulation >= '" + reference_date + "'"
        )
        print("  Using date filter for mappings (enddatearearegulation null or >= today).")
    for mgr in TARGET_CITIES:
        mapping_raw.extend(fetch_json(MAPPING_URL, {"areamanagerid": mgr, **mapping_params_base}))
    mapping_raw.sort(key=lambda x: x.get('startdatearearegulation', '0'), reverse=True)
    area_to_reg = {}
    proc_map = set()
    for item in mapping_raw:
        aid, rid = item.get('areaid'), item.get('regulationid')
        if aid and rid and (aid, rid) not in proc_map:
            if aid not in area_to_reg: area_to_reg[aid] = []
            area_to_reg[aid].append(rid)
            proc_map.add((aid, rid))

    # 3. Time Slots
    slots_raw = []
    for mgr in TARGET_CITIES:
        slots_raw.extend(fetch_json(TIJDVAK_URL, {"areamanagerid": mgr, "$limit": 10000}))
    slots_raw.sort(key=lambda x: x.get('startdatetimeframe', '0'), reverse=True)
    tijdvak_map = {}
    proc_slots = set()
    for s in slots_raw:
        rid, day, start = s.get('regulationid'), s.get('daytimeframe'), s.get('starttimetimeframe')
        # Store ALL slots for a regulation for max_duration scan
        if rid:
             if rid not in tijdvak_map: tijdvak_map[rid] = []
             tijdvak_map[rid].append(s)

    # 4. Tariffs & Descriptions
    tarief_raw = []
    for mgr in TARGET_CITIES:
        tarief_raw.extend(fetch_json(TARIEFDEEL_URL, {"areamanagerid": mgr, "$limit": 10000}))

    reg_info_raw = []
    for mgr in TARGET_CITIES:
        reg_info_raw.extend(fetch_json(DESC_URL, {"areamanagerid": mgr, "$limit": 5000}))

    calc_desc_raw = []
    for mgr in TARGET_CITIES:
        calc_desc_raw.extend(fetch_json(CALC_URL, {"areamanagerid": mgr, "$limit": 5000}))

    reg_map = {(r['areamanagerid'], r['regulationid']): (r.get('regulationdesc'), r.get('regulationtype', 'B')) for r in reg_info_raw if 'areamanagerid' in r and 'regulationid' in r}
    calc_map = {(c['areamanagerid'], c['farecalculationcode']): c.get('farecalculationdesc') for c in calc_desc_raw if 'areamanagerid' in c and 'farecalculationcode' in c}

    tariff_parts_map = {}
    tarief_raw.sort(key=lambda x: x.get('startdatefarepart', '0'), reverse=True)
    today = datetime.now().strftime("%Y%m%d")
    proc_tar = set()
    for i in tarief_raw:
        m, c, d = i.get('areamanagerid'), i.get('farecalculationcode'), i.get('startdatefarepart', '0')
        if c and (m, c) not in proc_tar and d <= today:
            amt, step = float(i.get('amountfarepart', 0)), float(i.get('stepsizefarepart', 1))
            rate = (amt/step)*60 if step > 0 else 0
            tariff_parts_map[(m, c)] = (rate, step, amt)
            proc_tar.add((m, c))

    # Merge all unique Area IDs
    all_area_ids = set()
    area_specs = {} # Map areaid -> spec dict

    # Process Specs
    for item in zones_raw:
        aid = item.get('areaid')
        if aid:
            all_area_ids.add((item.get('areamanagerid'), aid))
            area_specs[(item.get('areamanagerid'), aid)] = item

    # Process Mappings
    for item in mapping_raw:
        aid = item.get('areaid')
        mid = item.get('areamanagerid')
        if aid and mid and (mid, aid) not in all_area_ids:
            all_area_ids.add((mid, aid))
            area_specs[(mid, aid)] = {
                'areamanagerid': mid, 'areaid': aid, 'areadesc': None, 'areageometryaswgs84': None
            }

    print(f"Total unique zones found: {len(all_area_ids)}")

    processed_zones = []
    count = 0
    for (mgr_id, zone_id) in all_area_ids:

        item = area_specs.get((mgr_id, zone_id))
        city = TARGET_CITIES.get(mgr_id, "Unknown")
        name = item.get('areadesc') or f"{city} Zone {zone_id}"

        # Geolocation logic
        city_centers = {"363": (52.3676, 4.9041), "599": (51.9225, 4.47917), "518": (52.0705, 4.3007), "344": (52.0907, 5.1214)}
        lat, lon = city_centers.get(mgr_id, (52.0907, 5.1214))
        geo = item.get('areageometryaswgs84')
        if geo and 'coordinates' in geo:
            try:
                c = geo['coordinates']
                while isinstance(c[0], list): c = c[0]
                lon, lat = c[0], c[1]
            except: pass
        if abs(lat - city_centers.get(mgr_id, (0,0))[0]) < 0.1:
            h = sum(ord(c) for c in zone_id); lat += ((h%100)-50)*0.0004; lon += (((h*13)%100)-50)*0.0006

        display_id = ALIASES.get(f"{mgr_id}_{zone_id}", zone_id)

        if zone_id == "T12B" or zone_id == "T12B_U11":
             print(f"Processing {zone_id} -> Display: {display_id}")

        # Rates
        rids = area_to_reg.get(zone_id, [zone_id])
        all_opts = []

        # Max Duration & Holidays Init
        max_dur_mins = 24 * 60
        special_rules = False

        for rid in rids:
            r_desc, rtype = reg_map.get((mgr_id, rid), (None, 'B'))

            # Use all slots for metadata scan
            # But filter for valid rate slots
            valid_slots = []

            # Helper to dedupe slots processed
            seen_slots = set()

            raw_slots = tijdvak_map.get(rid, [])
            for s in raw_slots:
                # Metadata Check
                md = int(s.get('maxdurationright', 0))
                if md > 0: max_dur_mins = md

                day_tf = s.get('daytimeframe', '')
                if day_tf not in ["MAANDAG", "DINSDAG", "WOENSDAG", "DONDERDAG", "VRIJDAG", "ZATERDAG", "ZONDAG", "DAGELIJKS"]:
                    special_rules = True

                # Rate Processing Logic
                sig = (s.get('daytimeframe'), s.get('starttimetimeframe'))
                if sig in seen_slots: continue
                seen_slots.add(sig)

                cc = s.get('farecalculationcode')
                t_info = tariff_parts_map.get((mgr_id, cc))
                if t_info:
                    desc_text = calc_map.get((mgr_id, cc), cc) or ""

                    if 'kaart' in desc_text.lower(): continue
                    # D3: step > 60 (e.g. dagkaarten) now included; display handled below (e.g. step >= 480 -> "€ X / dag")

                    all_opts.append({
                        "day": s.get('daytimeframe', 'Daily'),
                        "start": int(s.get('starttimetimeframe', '0').zfill(4)),
                        "end": int(s.get('endtimetimeframe', '2400').zfill(4)),
                        "rate": t_info[0], "step": t_info[1], "amt": t_info[2],
                        "desc": desc_text, "type": rtype
                    })

        # Process per day
        final_rates = []
        day_names = ["MAANDAG", "DINSDAG", "WOENSDAG", "DONDERDAG", "VRIJDAG", "ZATERDAG", "ZONDAG"]

        # Expand 'Daily'
        by_day = {}
        for o in all_opts:
            d_raw = o['day'].upper()
            days_to_apply = day_names if d_raw in ['DAGELIJKS', 'DAILY', 'ELKE DAG'] else [d_raw]
            for d in days_to_apply:
                if d not in by_day: by_day[d] = []
                c = o.copy()
                c['day'] = d
                by_day[d].append(c)

        day_order = {d: i for i, d in enumerate(day_names)}
        sorted_days = sorted(by_day.keys(), key=lambda d: day_order.get(d, 99))

        for day in sorted_days:
            opts = by_day[day]
            if not opts: continue

            # Sweep Line Points
            points = set([0, 2400])
            for o in opts:
                points.add(o['start'])
                points.add(o['end'])
            sorted_points = sorted(list(points))

            merged_slots = []
            for i in range(len(sorted_points) - 1):
                t_start = sorted_points[i]
                t_end = sorted_points[i+1]

                active = [r for r in opts if r['start'] <= t_start and r['end'] >= t_end]

                if not active:
                    best = {"rate": 0, "desc": "Vrij parkeren", "amt": 0, "step": 0}
                else:
                    active.sort(key=lambda x: (x['rate'], len(x['desc'])), reverse=True)
                    best = active[0]

                if merged_slots:
                    prev = merged_slots[-1]
                    price_match = abs(prev['rate'] - best['rate']) < 0.01
                    if price_match:
                        prev['end'] = t_end
                        continue

                merged_slots.append({
                    "start": t_start, "end": t_end,
                    "rate": best['rate'], "desc": best['desc'], "step": best['step'], "amt": best['amt']
                })

            # Post-Process: Merge adjacent PAID slots with LLM Translation
            final_merged = []
            if merged_slots:
                curr = merged_slots[0]
                curr['source_slots'] = [curr.copy()]

                for i in range(1, len(merged_slots)):
                    next_s = merged_slots[i]
                    is_curr_paid = curr['rate'] > 0
                    is_next_paid = next_s['rate'] > 0

                    if is_curr_paid and is_next_paid:
                        curr['end'] = next_s['end']
                        curr['rate'] = max(curr['rate'], next_s['rate'])
                        curr['source_slots'].append(next_s)
                    else:
                        final_merged.append(curr)
                        curr = next_s
                        curr['source_slots'] = [curr.copy()]
                final_merged.append(curr)

                # Generate Text & Labels
                for m in final_merged:
                    m['formatted_lines'] = []
                    seen_texts = set()

                    # Calculate Display Price (e.g. per 15 min)
                    display_price_label = f"\u20ac {m['rate']:.2f} / u" # Default

                    steps = [s['step'] for s in m['source_slots'] if s['rate'] > 0]
                    if steps:
                        avg_step = max(set(steps), key=steps.count)
                        if avg_step >= 480:
                            day_amt = next((s['amt'] for s in m['source_slots'] if s.get('step', 0) >= 480 and s['rate'] > 0), m['amt'])
                            display_price_label = f"\u20ac {day_amt:.2f} / dag"
                        elif avg_step >= 10:
                            step_price = (m['rate'] / 60) * avg_step
                            display_price_label = f"\u20ac {step_price:.2f} / {int(avg_step)} min"

                    m['display_label'] = display_price_label

                    for s in m['source_slots']:
                         # CALL LLM HERE
                         if s['desc'] and ("stappen" in s['desc'] or "Stop" in s['desc'] or len(s['desc']) > 15):
                             txt = translate_desc_llm(s['desc'], m['rate'])
                         else:
                             txt = None

                         if not txt:
                             if s['rate'] > 0:
                                 if s['step'] >= 480:
                                     txt = f"\u20ac {s['amt']:.2f} / dag"
                                 else:
                                     txt = f"\u20ac {s['rate']:.2f} per uur"
                                     if s['step'] > 0 and s['step'] != 60:
                                         txt += f" (stappen van {int(s['step'])} min)"

                         if txt and txt not in seen_texts:
                             m['formatted_lines'].append(txt)
                             seen_texts.add(txt)

            # Format Output
            for m in final_merged:
                if m['rate'] == 0:
                     label = "Free parking"
                     detail = "Vrij parkeren"
                else:
                     label = m.get('display_label', f"\u20ac {m['rate']:.2f} / h")
                     detail = "|".join(m.get('formatted_lines', []))

                t_str = f"{day.capitalize()} {str(m['start']).zfill(4)[:2]}:{str(m['start']).zfill(4)[2:]} - {str(m['end']).zfill(4)[:2]}:{str(m['end']).zfill(4)[2:]}"

                final_rates.append({
                    "time": t_str,
                    "price": label.replace('.', ','),
                    "detail": detail,
                    "rate_numeric": round(m["rate"], 2)
                })

        best_price = 0.0
        for m in final_rates:
            # Simple heuristic for map pin price
             pass

        if final_rates:
             # Find max price for pin
             # Since 'price' is a string now, we need to rely on what we calculated earlier.
             # Actually, let's just re-iterate opts for max rate
             max_r = 0
             for o in all_opts:
                 if o['rate'] > max_r: max_r = o['rate']
             best_price = max_r

        processed_zones.append({
            "id": display_id, "name": name, "city": city, "mgr_id": mgr_id,
            "lat": lat, "lng": lon, "price": best_price,
            "rates": final_rates,
            "max_duration_mins": max_dur_mins,
            "has_special_rules": special_rules
        })

    print(f"Uploading {len(processed_zones)} zones...")

    # UsageID Mapping for Filter
    usage_map = {}
    for item in mapping_raw:
        if 'usageid' in item:
            usage_map[(item.get('areamanagerid'), item.get('areaid'))] = item.get('usageid')

    filtered_zones = []
    skipped_count = 0

    # Types to explicitly exclude
    EXCLUDED_TYPES = [
        'VERGUNP', 'BEWONERP', 'DEELAUTOP', 'VERGUNZ', 'GPK', 'BEDRIJFP',
        'BEZOEKBDP', 'ONTHEFFING', 'GARAGEP', 'CARPOOL', 'GEBIEDVRIJ',
        'MILIEUZONE', 'ZE_ONTHEF', 'GSL_ONTHEF', 'GPKB', 'TERREINP'
    ]

    for z in processed_zones:
        uid = usage_map.get((z['mgr_id'], z['id']), "UNKNOWN")

        # 1. Filter by Usage Type
        if uid in EXCLUDED_TYPES:
            skipped_count += 1
            print(f"Skipping {z['id']} ({uid}) - Restricted Type")
            continue

        # 2. Filter by Price 0 (General Garbage Collection)
        if z['price'] == 0:
            skipped_count += 1
            print(f"Skipping {z['id']} ({uid}) - Price is 0")
            continue

        filtered_zones.append(z)

    print(f"Filtered out {skipped_count} zones. Uploading {len(filtered_zones)} valid zones...")

    # D1: tariefintegriteit – check vóór upload (geen lege rates bij price > 0; price vs max(rate_numeric))
    try:
        from scripts.check_tarief_integriteit import check_zone_integrity
        integrity_violations = []
        for z in filtered_zones:
            doc_id = f"{z['mgr_id']}_{z['id']}" if z['id'] != z['name'] else z['id']
            integrity_violations.extend(check_zone_integrity(doc_id, z))
        if integrity_violations:
            print("D1 Tariefintegriteit: schendingen gevonden (geen upload):")
            for zid, code, msg in integrity_violations:
                print(f"  [{zid}] {code}: {msg}")
            sys.exit(1)
    except ImportError:
        pass  # script kan standalone draaien zonder scripts-package

    # D2: timestamp per run for debugging / datum- en versiecontrole
    run_updated_at = datetime.now(timezone.utc).isoformat()

    for z in filtered_zones:
        doc_id = f"{z['mgr_id']}_{z['id']}" if z['id'] != z['name'] else z['id']
        doc_data = {**z, "updated_at": run_updated_at}
        db.collection('zones').document(doc_id).set(doc_data)
    print("Done.")

if __name__ == "__main__":
    run_update()
