# B2B Fleet Parking – Database Schema for Billing

Production-ready schema for parking sessions and monthly subscriptions, supporting Payment Request generation with VAT breakdown.

---

## DATABASE 1: parking_sessions

**Firestore collection:** `parking_sessions`  
**One document per parking session.** Includes zero-transaction (free parking) sessions.

### Field specification (logical order)

#### A) Identity & whitelisting
| Field | Type | Required | Indexed | Notes |
|-------|------|----------|---------|-------|
| session_id | string (UUID) | yes | PK (doc id) | Firestore document ID |
| card_number | string | yes | yes | Fuel/charging card – whitelisting key |
| card_type | string | yes | no | enum: `fuel_card`, `charging_card` |
| user_id | string (UUID) | yes | yes | Employee UUID |
| user_name | string | yes | no | Display name |
| user_email | string | no | no | Nullable |
| company_id | string (UUID) | yes | yes | Fleet/tenant ID |
| company_name | string | yes | no | Fleet/company name |

#### B) Provider & audit
| Field | Type | Required | Indexed | Notes |
|-------|------|----------|---------|-------|
| provider_transaction_id | string | no | no | External system reference |
| source_system | string | yes | no | e.g. `app`, `provider` |
| created_at | timestamp | yes | yes | ISO 8601, with timezone |
| updated_at | timestamp | yes | no | ISO 8601, with timezone |

#### C) Time & duration
| Field | Type | Required | Indexed | Notes |
|-------|------|----------|---------|-------|
| start_datetime | timestamp | yes | yes | ISO 8601, with timezone |
| end_datetime | timestamp | yes | no | ISO 8601, with timezone |
| duration_seconds | integer | yes | no | Computed |

#### D) Location & vehicle
| Field | Type | Required | Indexed | Notes |
|-------|------|----------|---------|-------|
| location_type | string | yes | no | enum: `street`, `garage` |
| location_name | string | no | no | Zone/area name |
| city | string | no | no | |
| country | string | no | no | e.g. NL |
| zone_id | string | yes | no | Parking zone ID |
| zone_name | string | no | no | |
| license_plate | string | no | no | Nullable |

#### E) Parking charges (VAT exempt)

Parking tax is **not** subject to VAT. Stored explicitly as VAT-exempt.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| parking_amount_excl_vat | number | yes | Decimal, 2 places |
| parking_amount_incl_vat | number | yes | Same as excl when exempt |
| parking_vat_amount | number | yes | Always 0 |
| parking_vat_exempt | boolean | yes | Always true |
| parking_vat_exemption_reason | string | yes | e.g. "Parking tax – VAT exempt" |
| currency | string | yes | e.g. EUR |

#### F) Zero transaction & transaction fee logic

Transaction fees apply **only** when `parking_amount_excl_vat > 0`.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| is_zero_transaction | boolean | yes | true when parking_amount_excl_vat = 0 |
| transaction_fee_applicable | boolean | yes | true when parking_amount_excl_vat > 0 |

**If transaction_fee_applicable = false:** all transaction fee fields MUST be null.

**If transaction_fee_applicable = true:** transaction fees are subject to VAT (e.g. 21%).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| transaction_fee_excl_vat | number | nullable | Decimal, 2 places |
| transaction_fee_vat_rate | number | nullable | e.g. 21 |
| transaction_fee_vat_amount | number | nullable | |
| transaction_fee_incl_vat | number | nullable | |

---

## DATABASE 2: monthly_subscriptions

**Firestore collection:** `monthly_subscriptions`  
**One document per user per billing period (YYYY-MM).** Subscription fees are **never** stored in parking_sessions.

### Field specification

| Field | Type | Required | Indexed | Notes |
|-------|------|----------|---------|-------|
| subscription_id | string (UUID) | yes | PK (doc id) | Firestore document ID |
| billing_period | string | yes | yes | Format YYYY-MM |
| user_id | string (UUID) | yes | yes | |
| card_number | string | no | no | Recommended |
| company_id | string (UUID) | yes | yes | |
| subscription_type | string | yes | no | e.g. "monthly_subscription" |
| subscription_fee_excl_vat | number | yes | no | Decimal |
| subscription_vat_rate | number | yes | no | e.g. 21 |
| subscription_vat_amount | number | yes | no | |
| subscription_fee_incl_vat | number | yes | no | |
| currency | string | yes | no | e.g. EUR |
| subscription_start_date | date | no | no | Optional |
| subscription_end_date | date | no | no | Optional |
| proration_applied | boolean | no | no | Optional |
| proration_ratio | number | no | no | Optional |
| source | string | no | no | e.g. "monthly_subscription" |
| created_at | timestamp | no | no | |
| updated_at | timestamp | no | no | |

---

## Supporting collections (existing)

- **users:** add `card_number` (string), `card_type` (string) for whitelisting.
- **tenants:** use as companies; `company_id` in parking_sessions = tenant document ID.

---

## Firestore composite indexes (add)

```json
{
  "collectionGroup": "parking_sessions",
  "fields": [
    { "fieldPath": "company_id", "order": "ASCENDING" },
    { "fieldPath": "start_datetime", "order": "ASCENDING" }
  ]
},
{
  "collectionGroup": "parking_sessions",
  "fields": [
    { "fieldPath": "user_id", "order": "ASCENDING" },
    { "fieldPath": "start_datetime", "order": "ASCENDING" }
  ]
},
{
  "collectionGroup": "parking_sessions",
  "fields": [
    { "fieldPath": "card_number", "order": "ASCENDING" },
    { "fieldPath": "start_datetime", "order": "ASCENDING" }
  ]
},
{
  "collectionGroup": "monthly_subscriptions",
  "fields": [
    { "fieldPath": "company_id", "order": "ASCENDING" },
    { "fieldPath": "billing_period", "order": "ASCENDING" }
  ]
}
```

---

## Payment Request generation

Exports from both collections together allow:

- Payment Request header (company, period)
- Summary totals: parking (VAT exempt), transaction fees (VAT taxable), subscriptions (VAT taxable)
- VAT breakdown
- Detailed transaction overview
