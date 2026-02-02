# Q8 Parking - Cloud Functions

Firebase Cloud Functions for automated parking session management.

## Functions

### `autoStopExpiredSessions`
**Trigger:** Scheduled (every 1 minute)  
**Region:** europe-west1

Automatically stops parking sessions when:
1. **Duration expired** - The session's `startTime + duration` has passed
2. **Allowed time end** - The driver's `allowedTimeEnd` setting has passed

When a session is auto-stopped:
- Session status is updated to `ended` with `endedBy: 'auto'`
- A transaction record is created in `transactions` collection
- An audit log entry is written (for tenanted users)

### `triggerAutoStop`
**Trigger:** HTTPS Callable  
**Region:** europe-west1

HTTP endpoint to manually trigger the auto-stop check. Useful for testing or admin purposes.

**Authentication:** Requires authenticated user with `role: 'fleetmanager'`

**Response:**
```json
{
  "success": true,
  "message": "Auto-stop triggered. Stopped 2 session(s).",
  "stoppedCount": 2,
  "stoppedSessions": [
    { "sessionId": "abc123", "plate": "AB-123-CD", "reason": "duration_expired" }
  ]
}
```

## Setup

1. Navigate to the functions folder:
   ```bash
   cd functions
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Deploy:
   ```bash
   firebase deploy --only functions
   ```

## Local Testing

Use the Firebase Emulator to test locally:

```bash
npm run serve
```

This starts the Functions emulator at http://localhost:5001

## Logs

View function logs:
```bash
npm run logs
```

Or in Firebase Console: https://console.firebase.google.com/project/_/functions/logs

## Environment

- **Node.js:** 18
- **Region:** europe-west1 (Belgium)
- **Timezone:** Europe/Amsterdam
