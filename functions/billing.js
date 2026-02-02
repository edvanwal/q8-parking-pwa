/**
 * Q8 Parking - Billing Export & Schema Helpers
 *
 * Export functions for Parking_Sessions and Monthly_Subscriptions.
 * Output: CSV and JSON for Payment Request generation.
 */

const admin = require('firebase-admin');

/**
 * Normalize a parking session doc for export (Firestore Timestamp -> ISO string, numbers).
 */
function normalizeSessionForExport(doc) {
  const d = typeof doc.data === 'function' ? doc.data() : (doc.data || doc);
  const id = doc.id || d.session_id;
  const toIso = (v) => {
    if (!v) return null;
    if (v.toDate) return v.toDate().toISOString();
    if (v instanceof Date) return v.toISOString();
    return String(v);
  };
  const toNum = (v) => (v == null ? null : typeof v === 'number' ? v : parseFloat(v));

  return {
    session_id: id,
    card_number: d.card_number ?? null,
    card_type: d.card_type ?? null,
    user_id: d.user_id ?? null,
    user_name: d.user_name ?? null,
    user_email: d.user_email ?? null,
    company_id: d.company_id ?? null,
    company_name: d.company_name ?? null,
    provider_transaction_id: d.provider_transaction_id ?? null,
    source_system: d.source_system ?? null,
    created_at: toIso(d.created_at),
    updated_at: toIso(d.updated_at),
    start_datetime: toIso(d.start_datetime),
    end_datetime: toIso(d.end_datetime),
    duration_seconds: d.duration_seconds != null ? Number(d.duration_seconds) : null,
    location_type: d.location_type ?? null,
    location_name: d.location_name ?? null,
    city: d.city ?? null,
    country: d.country ?? null,
    zone_id: d.zone_id ?? null,
    zone_name: d.zone_name ?? null,
    license_plate: d.license_plate ?? null,
    parking_amount_excl_vat: toNum(d.parking_amount_excl_vat),
    parking_amount_incl_vat: toNum(d.parking_amount_incl_vat),
    parking_vat_amount: toNum(d.parking_vat_amount),
    parking_vat_exempt: d.parking_vat_exempt ?? true,
    parking_vat_exemption_reason: d.parking_vat_exemption_reason ?? null,
    currency: d.currency ?? 'EUR',
    is_zero_transaction: d.is_zero_transaction ?? false,
    transaction_fee_applicable: d.transaction_fee_applicable ?? false,
    transaction_fee_excl_vat: d.transaction_fee_applicable ? toNum(d.transaction_fee_excl_vat) : null,
    transaction_fee_vat_rate: d.transaction_fee_applicable ? toNum(d.transaction_fee_vat_rate) : null,
    transaction_fee_vat_amount: d.transaction_fee_applicable ? toNum(d.transaction_fee_vat_amount) : null,
    transaction_fee_incl_vat: d.transaction_fee_applicable ? toNum(d.transaction_fee_incl_vat) : null,
  };
}

/**
 * Normalize subscription doc for export.
 */
function normalizeSubscriptionForExport(doc) {
  const d = typeof doc.data === 'function' ? doc.data() : (doc.data || doc);
  const id = doc.id || d.subscription_id;
  const toIso = (v) => {
    if (!v) return null;
    if (v.toDate) return v.toDate().toISOString();
    if (v instanceof Date) return v.toISOString();
    return String(v);
  };
  const toNum = (v) => (v == null ? null : typeof v === 'number' ? v : parseFloat(v));

  return {
    subscription_id: id,
    billing_period: d.billing_period ?? null,
    user_id: d.user_id ?? null,
    card_number: d.card_number ?? null,
    company_id: d.company_id ?? null,
    subscription_type: d.subscription_type ?? null,
    subscription_fee_excl_vat: toNum(d.subscription_fee_excl_vat),
    subscription_vat_rate: toNum(d.subscription_vat_rate),
    subscription_vat_amount: toNum(d.subscription_vat_amount),
    subscription_fee_incl_vat: toNum(d.subscription_fee_incl_vat),
    currency: d.currency ?? 'EUR',
    subscription_start_date: d.subscription_start_date ?? null,
    subscription_end_date: d.subscription_end_date ?? null,
    proration_applied: d.proration_applied ?? null,
    proration_ratio: toNum(d.proration_ratio),
    source: d.source ?? null,
    created_at: toIso(d.created_at),
    updated_at: toIso(d.updated_at),
  };
}

/**
 * Convert array of objects to CSV string.
 * Uses null for missing values; numeric fields as numbers.
 */
function toCSV(rows, columns) {
  if (rows.length === 0) return columns.join(',') + '\n';
  const escape = (v) => {
    if (v == null) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.join(',') + '\n';
  const body = rows.map((r) => columns.map((c) => escape(r[c])).join(',')).join('\n');
  return header + body;
}

/** Parking sessions CSV columns (in schema order). */
const PARKING_SESSION_COLUMNS = [
  'session_id', 'card_number', 'card_type', 'user_id', 'user_name', 'user_email',
  'company_id', 'company_name', 'provider_transaction_id', 'source_system', 'created_at', 'updated_at',
  'start_datetime', 'end_datetime', 'duration_seconds',
  'location_type', 'location_name', 'city', 'country', 'zone_id', 'zone_name', 'license_plate',
  'parking_amount_excl_vat', 'parking_amount_incl_vat', 'parking_vat_amount',
  'parking_vat_exempt', 'parking_vat_exemption_reason', 'currency',
  'is_zero_transaction', 'transaction_fee_applicable',
  'transaction_fee_excl_vat', 'transaction_fee_vat_rate', 'transaction_fee_vat_amount', 'transaction_fee_incl_vat',
];

/** Subscription CSV columns. */
const SUBSCRIPTION_COLUMNS = [
  'subscription_id', 'billing_period', 'user_id', 'card_number', 'company_id',
  'subscription_type', 'subscription_fee_excl_vat', 'subscription_vat_rate',
  'subscription_vat_amount', 'subscription_fee_incl_vat', 'currency',
  'subscription_start_date', 'subscription_end_date', 'proration_applied', 'proration_ratio',
  'source', 'created_at', 'updated_at',
];

/**
 * Export parking_sessions.
 * @param {FirebaseFirestore.Firestore} db
 * @param {Object} filters - { company_id?, user_id?, card_number?, billing_period? }
 * @param {string} format - 'csv' | 'json'
 */
async function exportParkingSessions(db, filters, format) {
  const coll = db.collection('parking_sessions');

  let snapshot;
  if (filters.billing_period && !filters.company_id && !filters.user_id && !filters.card_number) {
    const [y, m] = String(filters.billing_period).split('-').map(Number);
    const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
    snapshot = await coll
      .where('start_datetime', '>=', admin.firestore.Timestamp.fromDate(start))
      .where('start_datetime', '<=', admin.firestore.Timestamp.fromDate(end))
      .orderBy('start_datetime', 'asc')
      .get();
  } else if (filters.company_id) {
    const baseQuery = coll.where('company_id', '==', filters.company_id);
    if (filters.billing_period) {
      const [y, m] = String(filters.billing_period).split('-').map(Number);
      const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
      snapshot = await baseQuery
        .where('start_datetime', '>=', admin.firestore.Timestamp.fromDate(start))
        .where('start_datetime', '<=', admin.firestore.Timestamp.fromDate(end))
        .orderBy('start_datetime', 'asc')
        .get();
    } else {
      snapshot = await baseQuery.orderBy('start_datetime', 'asc').get();
    }
  } else if (filters.user_id) {
    const baseQuery = coll.where('user_id', '==', filters.user_id);
    if (filters.billing_period) {
      const [y, m] = String(filters.billing_period).split('-').map(Number);
      const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
      snapshot = await baseQuery
        .where('start_datetime', '>=', admin.firestore.Timestamp.fromDate(start))
        .where('start_datetime', '<=', admin.firestore.Timestamp.fromDate(end))
        .orderBy('start_datetime', 'asc')
        .get();
    } else {
      snapshot = await baseQuery.orderBy('start_datetime', 'asc').get();
    }
  } else if (filters.card_number) {
    const baseQuery = coll.where('card_number', '==', filters.card_number);
    if (filters.billing_period) {
      const [y, m] = String(filters.billing_period).split('-').map(Number);
      const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
      snapshot = await baseQuery
        .where('start_datetime', '>=', admin.firestore.Timestamp.fromDate(start))
        .where('start_datetime', '<=', admin.firestore.Timestamp.fromDate(end))
        .orderBy('start_datetime', 'asc')
        .get();
    } else {
      snapshot = await baseQuery.orderBy('start_datetime', 'asc').get();
    }
  } else {
    snapshot = await coll.orderBy('start_datetime', 'asc').limit(5000).get();
  }

  const rows = snapshot.docs.map((doc) =>
    normalizeSessionForExport({ id: doc.id, ...doc.data() })
  );
  if (format === 'csv') return toCSV(rows, PARKING_SESSION_COLUMNS);
  return JSON.stringify(rows, null, 2);
}

/**
 * Export monthly_subscriptions.
 * @param {FirebaseFirestore.Firestore} db
 * @param {Object} filters - { company_id?, billing_period? }
 * @param {string} format - 'csv' | 'json'
 */
async function exportMonthlySubscriptions(db, filters, format) {
  const coll = db.collection('monthly_subscriptions');
  let snapshot;

  if (filters.company_id && filters.billing_period) {
    snapshot = await coll
      .where('company_id', '==', filters.company_id)
      .where('billing_period', '==', filters.billing_period)
      .orderBy('user_id', 'asc')
      .get();
  } else if (filters.company_id) {
    snapshot = await coll
      .where('company_id', '==', filters.company_id)
      .orderBy('billing_period', 'asc')
      .orderBy('user_id', 'asc')
      .limit(5000)
      .get();
  } else if (filters.billing_period) {
    snapshot = await coll
      .where('billing_period', '==', filters.billing_period)
      .orderBy('user_id', 'asc')
      .limit(5000)
      .get();
  } else {
    snapshot = await coll
      .orderBy('billing_period', 'asc')
      .orderBy('user_id', 'asc')
      .limit(5000)
      .get();
  }

  const rows = snapshot.docs.map((doc) =>
    normalizeSubscriptionForExport({ id: doc.id, data: () => doc.data() })
  );
  if (format === 'csv') return toCSV(rows, SUBSCRIPTION_COLUMNS);
  return JSON.stringify(rows, null, 2);
}

/**
 * Create a parking_sessions document from app session/transaction data.
 * Call this when a session ends (from Cloud Function or client).
 */
function createParkingSessionDoc(data) {
  const parkingAmountExcl = Number(data.parking_amount_excl_vat ?? data.cost ?? 0);
  const isZero = parkingAmountExcl <= 0;
  const feeApplicable = !isZero;

  const feeExcl = feeApplicable ? Number(data.transaction_fee_excl_vat ?? 0) : null;
  const feeRate = feeApplicable ? Number(data.transaction_fee_vat_rate ?? 21) : null;
  const feeVat = feeApplicable && feeExcl != null ? Math.round(feeExcl * (feeRate / 100) * 100) / 100 : null;
  const feeIncl = feeApplicable && feeExcl != null && feeVat != null ? Math.round((feeExcl + feeVat) * 100) / 100 : null;

  return {
    session_id: data.session_id || null,
    card_number: data.card_number || '',
    card_type: data.card_type || 'fuel_card',
    user_id: data.user_id || '',
    user_name: data.user_name || '',
    user_email: data.user_email ?? null,
    company_id: data.company_id || data.tenantId || '',
    company_name: data.company_name || '',
    provider_transaction_id: data.provider_transaction_id ?? null,
    source_system: data.source_system || 'app',
    created_at: data.created_at || admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
    start_datetime: data.start_datetime || data.start,
    end_datetime: data.end_datetime || data.end,
    duration_seconds: data.duration_seconds ?? null,
    location_type: data.location_type || 'street',
    location_name: data.location_name ?? null,
    city: data.city ?? null,
    country: data.country || 'NL',
    zone_id: data.zone_id || data.zoneUid || data.zone || '',
    zone_name: data.zone_name ?? null,
    license_plate: data.license_plate ?? data.plate ?? null,
    parking_amount_excl_vat: parkingAmountExcl,
    parking_amount_incl_vat: parkingAmountExcl,
    parking_vat_amount: 0,
    parking_vat_exempt: true,
    parking_vat_exemption_reason: 'Parking tax – VAT exempt',
    currency: data.currency || 'EUR',
    is_zero_transaction: isZero,
    transaction_fee_applicable: feeApplicable,
    transaction_fee_excl_vat: feeExcl,
    transaction_fee_vat_rate: feeRate,
    transaction_fee_vat_amount: feeVat,
    transaction_fee_incl_vat: feeIncl,
  };
}

module.exports = {
  exportParkingSessions,
  exportMonthlySubscriptions,
  createParkingSessionDoc,
  normalizeSessionForExport,
  normalizeSubscriptionForExport,
  PARKING_SESSION_COLUMNS,
  SUBSCRIPTION_COLUMNS,
};
