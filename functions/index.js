/**
 * Q8 Parking - Auto-stop Cloud Function
 * 
 * This scheduled function runs every minute to automatically stop parking sessions
 * that have exceeded their duration or are outside allowed time windows.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Send push notification to user
 */
async function sendPushToUser(uid, title, body, data = {}) {
    if (!uid) return false;
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) return false;
        const token = userDoc.data().fcmToken;
        if (!token) return false;
        await messaging.send({
            token,
            notification: { title, body, imageUrl: '/icons/favicon-32x32.png' },
            webpush: {
                fcmOptions: { link: '/' },
                notification: { icon: '/icons/favicon-32x32.png', tag: data.tag || 'q8-parking' }
            },
            data: { ...data, title: title || '', body: body || '' }
        });
        return true;
    } catch (err) {
        if (err.code === 'messaging/invalid-registration-token' || err.code === 'messaging/registration-token-not-registered') {
            await db.collection('users').doc(uid).update({ fcmToken: admin.firestore.FieldValue.delete() }).catch(() => {});
        }
        console.warn('Push send failed:', uid, err.message);
        return false;
    }
}

/**
 * Parse time string "HH:MM" to minutes since midnight
 */
function parseTimeToMinutes(timeStr) {
    if (!timeStr) return null;
    const match = String(timeStr).match(/^(\d{1,2}):(\d{2})/);
    return match ? parseInt(match[1], 10) * 60 + parseInt(match[2], 10) : null;
}

/**
 * Get current time in Europe/Amsterdam timezone
 */
function getNowInAmsterdam() {
    const now = new Date();
    // Convert to Amsterdam time
    const amsterdamTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }));
    return amsterdamTime;
}

/**
 * Get session end time - supports both session.end and startTime+duration
 */
function getSessionEndTime(session) {
    if (session.end) {
        const e = session.end;
        return e.toDate ? e.toDate() : (e._seconds ? new Date(e._seconds * 1000) : new Date(e));
    }
    if (!session.startTime || !session.duration) return null;
    let startMs;
    if (session.startTime.toDate) {
        startMs = session.startTime.toDate().getTime();
    } else if (session.startTime._seconds) {
        startMs = session.startTime._seconds * 1000;
    } else {
        startMs = new Date(session.startTime).getTime();
    }
    return new Date(startMs + session.duration * 60 * 1000);
}

/**
 * Check if session should be auto-stopped based on driver settings
 */
async function shouldStopByDriverSettings(session) {
    if (!session.userId) return false;
    
    try {
        const userDoc = await db.collection('users').doc(session.userId).get();
        if (!userDoc.exists) return false;
        
        const userData = userDoc.data();
        const driverSettings = userData.driverSettings || {};
        
        // Check allowedTimeEnd
        if (driverSettings.allowedTimeEnd) {
            const now = getNowInAmsterdam();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const endMinutes = parseTimeToMinutes(driverSettings.allowedTimeEnd);
            
            if (endMinutes !== null && currentMinutes >= endMinutes) {
                return {
                    reason: 'allowedTimeEnd',
                    message: `Session auto-stopped: past allowed end time (${driverSettings.allowedTimeEnd})`
                };
            }
        }
        
        return false;
    } catch (error) {
        console.error(`Error checking driver settings for user ${session.userId}:`, error);
        return false;
    }
}

/**
 * End a session and create a transaction record
 */
async function endSession(sessionDoc, reason) {
    const session = sessionDoc.data();
    const sessionId = sessionDoc.id;
    const now = admin.firestore.FieldValue.serverTimestamp();
    
    const batch = db.batch();
    
    // Update session status
    batch.update(sessionDoc.ref, {
        status: 'ended',
        endedAt: now,
        endedBy: 'auto',
        autoStopReason: reason
    });
    
    // Create transaction record
    const transactionData = {
        sessionId: sessionId,
        userId: session.userId || null,
        tenantId: session.tenantId || 'default',
        plate: session.plate || null,
        zone: session.zone || null,
        zoneId: session.zoneId || null,
        duration: session.duration || 0,
        price: session.price || 0,
        startedAt: session.startTime || session.createdAt,
        endedAt: now,
        endedBy: 'auto',
        autoStopReason: reason
    };
    
    const transactionRef = db.collection('transactions').doc();
    batch.set(transactionRef, transactionData);
    
    // Write audit log if tenant exists
    if (session.tenantId && session.tenantId !== 'default') {
        const auditData = {
            tenantId: session.tenantId,
            action: 'session_auto_stopped',
            details: {
                sessionId: sessionId,
                userId: session.userId,
                plate: session.plate,
                zone: session.zone,
                reason: reason
            },
            createdAt: now,
            createdBy: 'system'
        };
        const auditRef = db.collection('auditLog').doc();
        batch.set(auditRef, auditData);
    }
    
    await batch.commit();
    
    console.log(`Session ${sessionId} auto-stopped. Reason: ${reason}`);
    return true;
}

// --- PUSH NOTIFICATION TRIGGERS ---

/**
 * Push: Parkeersessie gestart (when session is created)
 */
exports.onSessionCreated = functions
    .region('europe-west1')
    .firestore
    .document('sessions/{sessionId}')
    .onCreate(async (snap, context) => {
        const data = snap.data();
        const uid = data.userId;
        if (!uid) return null;
        const settings = (await db.collection('users').doc(uid).get()).data()?.notificationSettings || {};
        if (settings.sessionStarted === false) return null;
        const zone = data.zone || '?';
        const plate = data.plate || '?';
        await sendPushToUser(uid, 'Q8 Parking', `Parkeersessie gestart · ${zone} · ${plate}`, {
            type: 'sessionStarted',
            tag: 'session-started'
        });
        return null;
    });

/**
 * Push: Parkeersessie gestopt door gebruiker (when user ends session)
 */
exports.onSessionUpdated = functions
    .region('europe-west1')
    .firestore
    .document('sessions/{sessionId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        if (before.status === 'active' && after.status === 'ended' && after.endedBy === 'user') {
            const uid = after.userId;
            if (!uid) return null;
            const settings = (await db.collection('users').doc(uid).get()).data()?.notificationSettings || {};
            if (settings.sessionEndedByUser === false) return null;
            const zone = after.zone || '?';
            const plate = after.plate || '?';
            await sendPushToUser(uid, 'Q8 Parking', `Parkeersessie gestopt · ${zone} · ${plate}`, {
                type: 'sessionEndedByUser',
                tag: 'session-ended'
            });
        }
        return null;
    });

/**
 * Main scheduled function - runs every minute
 * 1. Sends "expiring soon" push to sessions ending within X minutes
 * 2. Auto-stops sessions that have expired
 */
exports.autoStopExpiredSessions = functions
    .region('europe-west1')
    .pubsub
    .schedule('every 1 minutes')
    .timeZone('Europe/Amsterdam')
    .onRun(async (context) => {
        console.log('Running auto-stop check at:', new Date().toISOString());
        
        try {
            // Get all active sessions
            const sessionsSnapshot = await db
                .collection('sessions')
                .where('status', '==', 'active')
                .get();
            
            if (sessionsSnapshot.empty) {
                console.log('No active sessions found.');
                return null;
            }
            
            console.log(`Found ${sessionsSnapshot.size} active session(s)`);
            
            const now = new Date();
            let stoppedCount = 0;

            for (const sessionDoc of sessionsSnapshot.docs) {
                const session = sessionDoc.data();
                let shouldStop = false;
                let stopReason = '';

                // Push: "Expiring soon" - send if session ends within X minutes (and not yet sent)
                if (!session.expiringSoonPushSent && session.userId) {
                    const endTime = getSessionEndTime(session);
                    if (endTime && endTime > now) {
                        const userDoc = await db.collection('users').doc(session.userId).get();
                        const nSettings = userDoc.exists ? (userDoc.data().notificationSettings || {}) : {};
                        const mins = nSettings.expiringSoonMinutes || 10;
                        const wantsPush = nSettings.sessionExpiringSoon !== false;
                        const msUntilEnd = endTime.getTime() - now.getTime();
                        const msThreshold = mins * 60 * 1000;
                        if (wantsPush && msUntilEnd <= msThreshold) {
                            const sent = await sendPushToUser(
                                session.userId,
                                'Q8 Parking',
                                `Parkeersessie verloopt over ${mins} minuten · ${session.zone || '?'} · ${session.plate || '?'}`,
                                { type: 'sessionExpiringSoon', tag: 'parking-expiring' }
                            );
                            if (sent) {
                                await sessionDoc.ref.update({ expiringSoonPushSent: true }).catch(() => {});
                            }
                        }
                    }
                }

                // Check 1: Duration expired
                const endTime = getSessionEndTime(session);
                if (endTime && now >= endTime) {
                    shouldStop = true;
                    stopReason = 'duration_expired';
                    console.log(`Session ${sessionDoc.id}: duration expired (end time: ${endTime.toISOString()})`);
                }
                
                // Check 2: Driver settings (allowedTimeEnd)
                if (!shouldStop) {
                    const driverCheck = await shouldStopByDriverSettings(session);
                    if (driverCheck) {
                        shouldStop = true;
                        stopReason = driverCheck.reason;
                        console.log(`Session ${sessionDoc.id}: ${driverCheck.message}`);
                    }
                }
                
                // Stop the session if needed
                if (shouldStop) {
                    try {
                        await endSession(sessionDoc, stopReason);
                        stoppedCount++;
                    } catch (error) {
                        console.error(`Failed to stop session ${sessionDoc.id}:`, error);
                    }
                }
            }
            
            console.log(`Auto-stop complete. Stopped ${stoppedCount} session(s).`);
            return null;
            
        } catch (error) {
            console.error('Error in autoStopExpiredSessions:', error);
            throw error;
        }
    });

/**
 * HTTP endpoint to manually trigger auto-stop check (for testing/admin)
 * Protected: requires admin authentication
 */
exports.triggerAutoStop = functions
    .region('europe-west1')
    .https
    .onCall(async (data, context) => {
        // Check if user is authenticated and is a fleetmanager
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
        }
        
        try {
            const userDoc = await db.collection('users').doc(context.auth.uid).get();
            if (!userDoc.exists || userDoc.data().role !== 'fleetmanager') {
                throw new functions.https.HttpsError('permission-denied', 'Must be a fleet manager');
            }
            
            // Run the same logic as the scheduled function
            const sessionsSnapshot = await db
                .collection('sessions')
                .where('status', '==', 'active')
                .get();
            
            if (sessionsSnapshot.empty) {
                return { success: true, message: 'No active sessions found', stoppedCount: 0 };
            }
            
            const now = new Date();
            let stoppedCount = 0;
            const stoppedSessions = [];
            
            for (const sessionDoc of sessionsSnapshot.docs) {
                const session = sessionDoc.data();
                let shouldStop = false;
                let stopReason = '';
                
                const endTime = getSessionEndTime(session);
                if (endTime && now >= endTime) {
                    shouldStop = true;
                    stopReason = 'duration_expired';
                }
                
                if (!shouldStop) {
                    const driverCheck = await shouldStopByDriverSettings(session);
                    if (driverCheck) {
                        shouldStop = true;
                        stopReason = driverCheck.reason;
                    }
                }
                
                if (shouldStop) {
                    await endSession(sessionDoc, stopReason);
                    stoppedCount++;
                    stoppedSessions.push({
                        sessionId: sessionDoc.id,
                        plate: session.plate,
                        reason: stopReason
                    });
                }
            }
            
            return {
                success: true,
                message: `Auto-stop triggered. Stopped ${stoppedCount} session(s).`,
                stoppedCount,
                stoppedSessions
            };
            
        } catch (error) {
            console.error('Error in triggerAutoStop:', error);
            throw new functions.https.HttpsError('internal', error.message);
        }
    });
