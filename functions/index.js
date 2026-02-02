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
 * Calculate session end time based on start time and duration
 */
function getSessionEndTime(session) {
    if (!session.startTime || !session.duration) return null;
    
    let startMs;
    if (session.startTime.toDate) {
        // Firestore Timestamp
        startMs = session.startTime.toDate().getTime();
    } else if (session.startTime._seconds) {
        // Firestore Timestamp serialized
        startMs = session.startTime._seconds * 1000;
    } else {
        // Already a Date or timestamp
        startMs = new Date(session.startTime).getTime();
    }
    
    // Duration is in minutes
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

/**
 * Main scheduled function - runs every minute
 * Checks all active sessions and auto-stops those that have expired
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
