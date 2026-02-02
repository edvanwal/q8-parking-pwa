# Billing Export – Example Output

## Parking Sessions (JSON)

```json
[
  {
    "session_id": "ps-abc123",
    "card_number": "NL-FUEL-12345",
    "card_type": "fuel_card",
    "user_id": "usr-uuid-1",
    "user_name": "Jan Jansen",
    "user_email": "jan@company.nl",
    "company_id": "tenant-default",
    "company_name": "Acme Fleet BV",
    "provider_transaction_id": null,
    "source_system": "app",
    "created_at": "2025-02-01T14:30:00.000Z",
    "updated_at": "2025-02-01T15:45:00.000Z",
    "start_datetime": "2025-02-01T14:30:00.000Z",
    "end_datetime": "2025-02-01T15:45:00.000Z",
    "duration_seconds": 4500,
    "location_type": "street",
    "location_name": null,
    "city": "Utrecht",
    "country": "NL",
    "zone_id": "321",
    "zone_name": "Zone 321",
    "license_plate": "AB-123-C",
    "parking_amount_excl_vat": 3.75,
    "parking_amount_incl_vat": 3.75,
    "parking_vat_amount": 0,
    "parking_vat_exempt": true,
    "parking_vat_exemption_reason": "Parking tax – VAT exempt",
    "currency": "EUR",
    "is_zero_transaction": false,
    "transaction_fee_applicable": true,
    "transaction_fee_excl_vat": 0.25,
    "transaction_fee_vat_rate": 21,
    "transaction_fee_vat_amount": 0.05,
    "transaction_fee_incl_vat": 0.30
  },
  {
    "session_id": "ps-def456",
    "card_number": "NL-FUEL-67890",
    "card_type": "fuel_card",
    "user_id": "usr-uuid-2",
    "user_name": "Piet Pietersen",
    "user_email": "piet@company.nl",
    "company_id": "tenant-default",
    "company_name": "Acme Fleet BV",
    "provider_transaction_id": null,
    "source_system": "app",
    "created_at": "2025-02-01T09:00:00.000Z",
    "updated_at": "2025-02-01T09:30:00.000Z",
    "start_datetime": "2025-02-01T09:00:00.000Z",
    "end_datetime": "2025-02-01T09:30:00.000Z",
    "duration_seconds": 1800,
    "location_type": "street",
    "location_name": null,
    "city": "Amsterdam",
    "country": "NL",
    "zone_id": "101",
    "zone_name": "Zone 101",
    "license_plate": "G-346-VN",
    "parking_amount_excl_vat": 0,
    "parking_amount_incl_vat": 0,
    "parking_vat_amount": 0,
    "parking_vat_exempt": true,
    "parking_vat_exemption_reason": "Parking tax – VAT exempt",
    "currency": "EUR",
    "is_zero_transaction": true,
    "transaction_fee_applicable": false,
    "transaction_fee_excl_vat": null,
    "transaction_fee_vat_rate": null,
    "transaction_fee_vat_amount": null,
    "transaction_fee_incl_vat": null
  }
]
```

## Parking Sessions (CSV – excerpt)

```csv
session_id,card_number,card_type,user_id,user_name,user_email,company_id,company_name,provider_transaction_id,source_system,created_at,updated_at,start_datetime,end_datetime,duration_seconds,location_type,location_name,city,country,zone_id,zone_name,license_plate,parking_amount_excl_vat,parking_amount_incl_vat,parking_vat_amount,parking_vat_exempt,parking_vat_exemption_reason,currency,is_zero_transaction,transaction_fee_applicable,transaction_fee_excl_vat,transaction_fee_vat_rate,transaction_fee_vat_amount,transaction_fee_incl_vat
ps-abc123,NL-FUEL-12345,fuel_card,usr-uuid-1,Jan Jansen,jan@company.nl,tenant-default,Acme Fleet BV,,app,2025-02-01T14:30:00.000Z,2025-02-01T15:45:00.000Z,2025-02-01T14:30:00.000Z,2025-02-01T15:45:00.000Z,4500,street,,Utrecht,NL,321,Zone 321,AB-123-C,3.75,3.75,0,true,Parking tax – VAT exempt,EUR,false,true,0.25,21,0.05,0.30
ps-def456,NL-FUEL-67890,fuel_card,usr-uuid-2,Piet Pietersen,piet@company.nl,tenant-default,Acme Fleet BV,,app,2025-02-01T09:00:00.000Z,2025-02-01T09:30:00.000Z,2025-02-01T09:00:00.000Z,2025-02-01T09:30:00.000Z,1800,street,,Amsterdam,NL,101,Zone 101,G-346-VN,0,0,0,true,Parking tax – VAT exempt,EUR,true,false,,,,
```

## Monthly Subscriptions (JSON)

```json
[
  {
    "subscription_id": "sub-xyz789",
    "billing_period": "2025-02",
    "user_id": "usr-uuid-1",
    "card_number": "NL-FUEL-12345",
    "company_id": "tenant-default",
    "subscription_type": "monthly_subscription",
    "subscription_fee_excl_vat": 9.95,
    "subscription_vat_rate": 21,
    "subscription_vat_amount": 2.09,
    "subscription_fee_incl_vat": 12.04,
    "currency": "EUR",
    "subscription_start_date": "2025-02-01",
    "subscription_end_date": "2025-02-28",
    "proration_applied": false,
    "proration_ratio": null,
    "source": "monthly_subscription",
    "created_at": "2025-02-01T00:00:00.000Z",
    "updated_at": "2025-02-01T00:00:00.000Z"
  }
]
```

## Payment Request Summary (derived from exports)

| Line item                    | VAT treatment | Amount (excl) | VAT       | Amount (incl) |
|-----------------------------|--------------|---------------|-----------|---------------|
| Parking (sessions)          | VAT exempt   | 3.75          | 0         | 3.75          |
| Transaction fees            | 21% VAT      | 0.25          | 0.05      | 0.30          |
| Monthly subscription        | 21% VAT      | 9.95          | 2.09      | 12.04         |
| **Total**                   |              | **13.95**     | **2.14**  | **16.09**     |
