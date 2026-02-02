/**
 * Migration: Populate parking_sessions from existing transactions.
 *
 * Run with: node scripts/migrate-to-parking-sessions.js
 * Requires: GOOGLE_APPLICATION_CREDENTIALS or Firebase Admin SDK init.
 *
 * Creates parking_sessions documents with the full billing schema.
 * Uses transactions + users + tenants to enrich data.
 * For missing card_number, uses placeholder "MIGRATED-{userId}".
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

const TRANSACTION_FEE_RATE = 21; // VAT %
const TRANSACTION_FEE_EXCL = 0.25; // Example fixed fee per paid transaction

async function migrate() {
  const txSnap = await db.collection('transactions').orderBy('endedAt', 'asc').get();
  const users = new Map();
  const tenants = new Map();

  for (const doc of txSnap.docs) {
    const t = doc.data();
    const userId = t.userId;
    const tenantId = t.tenantId || 'default';

    if (userId && !users.has(userId)) {
      const u = await db.collection('users').doc(userId).get();
      users.set(userId, u.exists ? u.data() : {});
    }
    if (tenantId && !tenants.has(tenantId)) {
      const tn = await db.collection('tenants').doc(tenantId).get();
      tenants.set(tenantId, tn.exists ? tn.data() : {});
    }
  }

  let created = 0;
  let skipped = 0;

  for (const doc of txSnap.docs) {
    const t = doc.data();
    const existing = await db.collection('parking_sessions').where('provider_transaction_id', '==', doc.id).limit(1).get();
    if (!existing.empty) {
      skipped++;
      continue;
    }

    const userData = users.get(t.userId) || {};
    const tenantData = tenants.get(t.tenantId || 'default') || {};
    const cardNumber = userData.card_number || `MIGRATED-${t.userId}`;
    const cardType = userData.card_type || 'fuel_card';

    const startTs = t.start && (t.start.toDate ? t.start.toDate() : new Date(t.start));
    const endTs = t.end && (t.end.toDate ? t.end.toDate() : new Date(t.end));
    const durationSeconds = startTs && endTs ? Math.round((endTs - startTs) / 1000) : 0;

    const parkingAmountExcl = Number(t.cost ?? t.price ?? 0);
    const isZero = parkingAmountExcl <= 0;
    const feeApplicable = !isZero;

    let feeExcl = null, feeVat = null, feeIncl = null;
    if (feeApplicable) {
      feeExcl = TRANSACTION_FEE_EXCL;
      feeVat = Math.round(feeExcl * (TRANSACTION_FEE_RATE / 100) * 100) / 100;
      feeIncl = Math.round((feeExcl + feeVat) * 100) / 100;
    }

    const ps = {
      card_number: cardNumber,
      card_type: cardType,
      user_id: t.userId || '',
      user_name: userData.displayName || userData.email?.split('@')[0] || '',
      user_email: userData.email ?? null,
      company_id: t.tenantId || 'default',
      company_name: tenantData.name || tenantData.companyName || t.tenantId || 'Default',
      provider_transaction_id: doc.id,
      source_system: 'app',
      created_at: admin.firestore.Timestamp.fromDate(new Date()),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      start_datetime: admin.firestore.Timestamp.fromDate(startTs),
      end_datetime: admin.firestore.Timestamp.fromDate(endTs),
      duration_seconds: durationSeconds,
      location_type: 'street',
      location_name: null,
      city: t.street ? null : null,
      country: 'NL',
      zone_id: t.zoneUid || t.zone || '',
      zone_name: t.zone || null,
      license_plate: t.plate ?? null,
      parking_amount_excl_vat: parkingAmountExcl,
      parking_amount_incl_vat: parkingAmountExcl,
      parking_vat_amount: 0,
      parking_vat_exempt: true,
      parking_vat_exemption_reason: 'Parking tax – VAT exempt',
      currency: 'EUR',
      is_zero_transaction: isZero,
      transaction_fee_applicable: feeApplicable,
      transaction_fee_excl_vat: feeExcl,
      transaction_fee_vat_rate: feeApplicable ? TRANSACTION_FEE_RATE : null,
      transaction_fee_vat_amount: feeVat,
      transaction_fee_incl_vat: feeIncl,
    };

    await db.collection('parking_sessions').add(ps);
    created++;
    if (created % 50 === 0) console.log(`Created ${created} parking_sessions...`);
  }

  console.log(`Done. Created: ${created}, Skipped (already exists): ${skipped}`);
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
