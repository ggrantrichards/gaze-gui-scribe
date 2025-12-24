# AGENT_2_GAZE_TRACKING_AUTH.md

## Agent 2: Gaze Tracking & Flow Engineer

**Role:** Stabilize and refactor gaze tracking to be robust, auth-gated, and non-intrusive. Implement calibration persistence.

**Owner:** Cursor Agent 2 – Gaze Tracking & Flow Engineer  
**Last Updated:** December 23, 2025  
**Status:** Active Development

---

## Overview

ClientSight's **core differentiator** is real-time webcam-based eye-gaze tracking that drives dynamic UI/UX changes. Currently, the implementation has critical issues:

- Gaze UI **randomly reappears** in the middle of the site.
- Gaze tracking can be **triggered accidentally** by unrelated buttons.
- Gaze/calibration flows are **not gated** behind authentication.
- Calibration data is **not persisted**, forcing re-calibration every session.

Your mission: **Stabilize the gaze tracking system, enforce auth gating, eliminate phantom activation, and persist calibration per user.**

---

## Tech Stack (No Changes)

- **WebGazer.js** (browser-based gaze estimation via TensorFlow.js)
- **Firebase Auth** (user authentication + session management)
- **Firebase Firestore / Realtime Database** (store calibration metadata + session flags)
- **LocalForage / IndexedDB** (client-side storage for quick calibration load)
- **React 18 + TypeScript** (state management for gaze status)

---

## Primary Responsibilities

### 1. Auth-Gated Gaze Activation

**Problem:** Gaze tracking is currently available to anyone, including unauthenticated users. This is confusing and wastes resources.

**Solution:** Enforce the rule: **gaze tracking and calibration are only available to authenticated users.**

#### Implementation Strategy

1. **Create a Gaze Feature Flag** (per user session):
// types/gaze.ts
export interface GazeSession {
userId: string;
isGazeEnabled: boolean; // Only true if logged in
isCalibrated: boolean; // True if calibration exists + is valid
gazeStatus: 'idle' | 'calibrating' | 'tracking' | 'paused' | 'error';
calibrationAccuracy?: number; // e.g., ±78px
error?: string; // e.g., "Camera permission denied"
}

text

2. **Gaze Context / Provider** (single source of truth):
// contexts/GazeContext.tsx
export const GazeContext = React.createContext<{
session: GazeSession;
enableGaze: () => Promise<void>; // Requires auth
disableGaze: () => void;
startCalibration: () => void;
recalibrateGaze: () => Promise<void>;
pauseTracking: () => void;
resumeTracking: () => void;
} | null>(null);

export const GazeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
const { user } = useAuth();
const [session, setSession] = React.useState<GazeSession>({
userId: user?.uid || '',
isGazeEnabled: !!user, // Only enabled if logged in
isCalibrated: false,
gazeStatus: 'idle',
});

text
 // Implement enable/disable/calibrate/pause/resume handlers here
 // All handlers check `user` existence first
};

text

3. **Protect Gaze Activation Behind Auth Check**:
- In `enableGaze()`: Verify `useAuth()` returns a valid user. If not, reject or redirect to login.
- In component UI: Only show "Enable Gaze Tracking" button if `user` is authenticated.
- All gaze DOM elements (cursor overlay, calibration dialog) must only render if `isGazeEnabled && isLoggedIn`.

#### Public vs. Authenticated Views

**Unauthenticated User:**
- Landing page works normally (no gaze tracking).
- If they navigate to `/app` or any gaze-dependent route, redirect to login.
- Optionally show a **demo** with pre-recorded gaze data (no live tracking).

**Authenticated User (First Time):**
- Redirect to onboarding/calibration flow on first app access.
- Do not show gaze tracking UI until they explicitly enable it.

**Authenticated User (Returning):**
- Check if calibration exists + is valid.
- If yes, load calibration silently; if user enables tracking, it works immediately.
- If no, prompt to calibrate.

---

### 2. Stable, Non-Intrusive Gaze UI

**Problem:** Gaze overlay/dialog randomly reappear, and unrelated buttons can trigger tracking.

**Solution:** Implement a **rigid, single-source-of-truth state machine** for gaze status. All UI elements derive from this state.

#### Gaze State Machine

// utils/gazeStateMachine.ts
type GazeState = 'idle' | 'calibrating' | 'tracking' | 'paused' | 'error';

interface GazeStateMachineContext {
currentState: GazeState;
errorMessage?: string;
calibrationProgress?: number; // 0-100
}

export const gazeStateMachine = {
// Transitions (only valid moves allowed)
idle: {
startCalibration: () => 'calibrating',
enableTracking: () => 'tracking',
},
calibrating: {
completeCalibration: () => 'tracking',
cancelCalibration: () => 'idle',
error: (msg: string) => ({ newState: 'error', errorMessage: msg }),
},
tracking: {
pause: () => 'paused',
error: (msg: string) => ({ newState: 'error', errorMessage: msg }),
disable: () => 'idle',
},
paused: {
resume: () => 'tracking',
disable: () => 'idle',
},
error: {
retry: () => 'idle',
disable: () => 'idle',
},
};

text

#### UI Component Derivation

All gaze UI components derive their behavior and visibility **solely** from the state machine:

// components/GazeOverlay.tsx
export const GazeOverlay: React.FC = () => {
const { session } = useGaze();

// Only render if:
// 1. User is authenticated
// 2. Gaze is enabled AND tracking or calibrating
if (!session.isGazeEnabled || !['calibrating', 'tracking'].includes(session.gazeStatus)) {
return null;
}

return (
<div className="fixed inset-0 pointer-events-none z-50">
{/* Gaze cursor (small, non-intrusive) /}
{session.gazeStatus === 'tracking' && <GazeCursor />}
{/ Calibration dialog */}
{session.gazeStatus === 'calibrating' && <CalibrationDialog />}
</div>
);
};

text

#### Control Panel (Right Sidebar, Agent 1 design)

Only show controls that match the current state:

// components/GazeControlPanel.tsx
export const GazeControlPanel: React.FC = () => {
const { session, enableGaze, startCalibration, pauseTracking, resumeTracking, disableGaze } = useGaze();
const { user } = useAuth();

// Only show if logged in
if (!user) return null;

return (
<div className="p-4 border-t">
<h3 className="font-semibold text-sm mb-3">Gaze Tracking</h3>

text
  {/* Status indicator */}
  <StatusIndicator status={session.gazeStatus} label={getStatusLabel(session.gazeStatus)} />

  {/* Buttons: only show relevant to current state */}
  {session.gazeStatus === 'idle' && (
    <>
      <Button onClick={enableGaze} className="w-full mt-2">
        Enable Gaze Tracking
      </Button>
      <Button onClick={startCalibration} variant="secondary" className="w-full mt-2">
        Calibrate
      </Button>
    </>
  )}

  {session.gazeStatus === 'tracking' && (
    <>
      <Button onClick={pauseTracking} variant="secondary" className="w-full mt-2">
        Pause
      </Button>
      <Button onClick={disableGaze} variant="outline" className="w-full mt-2">
        Disable
      </Button>
    </>
  )}

  {session.gazeStatus === 'paused' && (
    <>
      <Button onClick={resumeTracking} className="w-full mt-2">
        Resume
      </Button>
      <Button onClick={disableGaze} variant="outline" className="w-full mt-2">
        Disable
      </Button>
    </>
  )}

  {session.gazeStatus === 'calibrating' && (
    <p className="text-sm text-slate-500 mt-2">Calibration in progress...</p>
  )}

  {session.gazeStatus === 'error' && (
    <Alert type="error" title="Gaze Tracking Error" message={session.error} />
  )}

  {/* Accuracy info (if tracked) */}
  {session.calibrationAccuracy && (
    <p className="text-xs text-slate-500 mt-3">Accuracy: ±{session.calibrationAccuracy}px</p>
  )}
</div>
);
};

text

#### Prevent Accidental Activation

**Rules:**
- Gaze tracking can **only be enabled** by:
  1. Clicking the "Enable Gaze Tracking" button in the control panel (deliberate action).
  2. Never by accident via DOM clicks, keyboard shortcuts, or auto-play.
- Remove any auto-enable logic or keyboard shortcuts that trigger gaze unexpectedly.
- If a user presses Escape, gaze UI closes and state reverts to `idle` (or `paused` if was tracking).

---

### 3. Calibration Persistence per User

**Problem:** Calibration is lost on page reload, forcing re-calibration every session.

**Solution:** Implement a **two-tier persistence strategy** (client-side + cloud).

#### Strategy Overview

1. **Client-Side (Local) Persistence** (primary):
   - Use WebGazer's built-in `localforage` or `IndexedDB` to store calibration data locally.
   - On page load, check for valid calibration in IndexedDB.
   - If valid, load it silently (user can start tracking immediately).
   - If invalid or missing, prompt to calibrate.

2. **Cloud Backup** (optional, secondary):
   - Store a minimal calibration profile in Firebase (tied to user ID).
   - Use this as a fallback if local storage is cleared or user logs in on a new device.
   - Store only:
     - Calibration timestamp.
     - A hash of calibration parameters (not raw sensitive data).
     - Calibration accuracy score.

#### Implementation

// utils/calibrationStorage.ts
export interface CalibrationData {
userId: string;
timestamp: number; // When calibrated
accuracy: number; // ±px error
deviceFingerprint: string; // Hash of browser/OS combo
webgazerData: any; // WebGazer internal state (opaque)
}

// Local storage functions
export async function saveCalibrationLocal(data: CalibrationData): Promise<void> {
const db = await localforage.createInstance({ name: 'clientsight_gaze' });
await db.setItem('calibration', JSON.stringify(data));
}

export async function loadCalibrationLocal(): Promise<CalibrationData | null> {
const db = await localforage.createInstance({ name: 'clientsight_gaze' });
const stored = await db.getItem('calibration');
return stored ? JSON.parse(stored as string) : null;
}

export async function clearCalibrationLocal(): Promise<void> {
const db = await localforage.createInstance({ name: 'clientsight_gaze' });
await db.removeItem('calibration');
}

// Firebase functions
export async function saveCalibrationToFirebase(
userId: string,
calibration: CalibrationData
): Promise<void> {
const db = getFirestore();
const ref = doc(db, 'users', userId, 'calibration', 'latest');
await setDoc(ref, {
timestamp: calibration.timestamp,
accuracy: calibration.accuracy,
deviceFingerprint: calibration.deviceFingerprint,
// DO NOT store raw WebGazer data to Firebase (privacy + size concerns)
});
}

export async function loadCalibrationFromFirebase(userId: string): Promise<CalibrationData | null> {
const db = getFirestore();
const ref = doc(db, 'users', userId, 'calibration', 'latest');
const snap = await getDoc(ref);
return snap.exists() ? (snap.data() as CalibrationData) : null;
}

text

#### On App Load (Auth Context)

// hooks/useGazeOnboarding.ts
export function useGazeOnboarding() {
const { user } = useAuth();
const { setSession } = useGaze();
const [isLoadingCalibration, setIsLoadingCalibration] = React.useState(true);

React.useEffect(() => {
if (!user) {
setIsLoadingCalibration(false);
return;
}

text
(async () => {
  try {
    // Try to load from local storage first (fastest)
    let calibration = await loadCalibrationLocal();

    // Validate: if older than 30 days, ask to recalibrate
    if (calibration && Date.now() - calibration.timestamp > 30 * 24 * 60 * 60 * 1000) {
      calibration = null; // Force recalibration
    }

    // If no local, try Firebase fallback
    if (!calibration) {
      calibration = await loadCalibrationFromFirebase(user.uid);
    }

    // Load into WebGazer
    if (calibration && calibration.webgazerData) {
      webgazer.setRegression(calibration.webgazerData);
      setSession((prev) => ({
        ...prev,
        isCalibrated: true,
        calibrationAccuracy: calibration!.accuracy,
      }));
    } else {
      setSession((prev) => ({
        ...prev,
        isCalibrated: false,
      }));
    }
  } catch (err) {
    console.error('Failed to load calibration:', err);
    setSession((prev) => ({
      ...prev,
      isCalibrated: false,
      gazeStatus: 'error',
      error: 'Failed to load calibration. Please recalibrate.',
    }));
  } finally {
    setIsLoadingCalibration(false);
  }
})();
}, [user, setSession]);

return { isLoadingCalibration };
}

text

#### On Successful Calibration

// Somewhere in calibration handler (e.g., CalibrationDialog.tsx)
async function handleCalibrationComplete() {
const calibrationData: CalibrationData = {
userId: user.uid,
timestamp: Date.now(),
accuracy: 78, // Measured during calibration
deviceFingerprint: getDeviceFingerprint(),
webgazerData: webgazer.getRegression(), // Store WebGazer state
};

// Save locally (primary)
await saveCalibrationLocal(calibrationData);

// Save to Firebase (secondary)
await saveCalibrationToFirebase(user.uid, calibrationData);

// Update gaze session
setSession((prev) => ({
...prev,
isCalibrated: true,
calibrationAccuracy: calibrationData.accuracy,
gazeStatus: 'idle', // Or 'tracking' if user wants to start immediately
}));
}

text

#### Device Fingerprinting (Optional)

To detect if user is on a different device:

// utils/deviceFingerprint.ts
export function getDeviceFingerprint(): string {
const fingerprint = {
userAgent: navigator.userAgent,
screenResolution: ${window.screen.width}x${window.screen.height},
timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};
return btoa(JSON.stringify(fingerprint)); // Simple encoding
}

text

---

### 4. Event & Error Handling

**Problem:** Failures are not surfaced to users; silent breakages confuse people.

**Solution:** Implement comprehensive error handling with user-friendly messaging.

#### Error Scenarios

| Scenario | State | Message | Recovery |
|----------|-------|---------|----------|
| Camera permission denied | `error` | "Camera access denied. Enable in browser settings." | Show settings link. |
| Camera not available (missing device) | `error` | "Camera not found. Check hardware." | Fallback to demo mode. |
| WebGazer initialization failed | `error` | "Gaze tracking unavailable. Try a different browser." | Suggest Chrome/Firefox. |
| Calibration aborted / incomplete | `idle` | "Calibration cancelled. Try again." | Show "Calibrate" button. |
| Calibration accuracy too low | `error` | "Calibration quality low (±120px). Retrying..." | Auto-retry 1x, then ask to recalibrate. |
| Gaze data stale (no updates for 5s) | `paused` | "Gaze tracking lost. Check lighting/webcam." | Show troubleshooting tips. |

#### Implementation

// hooks/useGazeErrorHandling.ts
export function useGazeErrorHandling() {
const { setSession } = useGaze();

const handleCameraError = (error: any) => {
let message = 'Camera error. Try restarting the browser.';
if (error.name === 'NotAllowedError') {
message = 'Camera access denied. Enable in browser settings.';
} else if (error.name === 'NotFoundError') {
message = 'Camera not found. Check hardware.';
}
setSession((prev) => ({
...prev,
gazeStatus: 'error',
error: message,
}));
};

const handleWebGazerError = (error: any) => {
setSession((prev) => ({
...prev,
gazeStatus: 'error',
error: 'Gaze initialization failed. Try a different browser.',
}));
};

return { handleCameraError, handleWebGazerError };
}

text

#### User-Facing Error Panel

// components/GazeErrorPanel.tsx
export const GazeErrorPanel: React.FC<{ error: string }> = ({ error }) => {
return (
<Alert
type="error"
title="Gaze Tracking Issue"
message={error}
actions={[
{ label: 'Retry', onClick: () => {/* retry logic /} },
{ label: 'Help', onClick: () => {/ show troubleshooting */} },
]}
/>
);
};

text

---

## Implementation Guidelines

### File Structure

src/
├── contexts/
│ └── GazeContext.tsx # Single source of truth for gaze state
├── hooks/
│ ├── useGaze.ts # Expose gaze context
│ ├── useGazeOnboarding.ts # Load calibration on app init
│ ├── useGazeErrorHandling.ts # Error handling + user messaging
│ ├── useWebGazer.ts # WebGazer.js wrapper
│ └── useCalibrationFlow.ts # Calibration UI + logic
├── utils/
│ ├── gazeStateMachine.ts # State machine definition
│ ├── calibrationStorage.ts # Local + Firebase persistence
│ └── deviceFingerprint.ts # Device identification (optional)
├── components/
│ ├── gaze/
│ │ ├── GazeOverlay.tsx # Cursor + heatmap overlay
│ │ ├── GazeCursor.tsx # Visual gaze cursor
│ │ ├── CalibrationDialog.tsx # Calibration UI
│ │ ├── GazeControlPanel.tsx # Right panel controls
│ │ └── GazeErrorPanel.tsx # Error messaging
│ └── ...
└── ...

text

### React Hooks Pattern

All gaze logic flows through `GazeContext` + hooks:

// Usage in any component
const { session, enableGaze, startCalibration, pauseTracking } = useGaze();

if (session.gazeStatus === 'tracking') {
// Show pause button
}

text

### Testing Checklist

- [ ] Gaze tracking is completely hidden for unauthenticated users.
- [ ] Logging in loads calibration automatically (no manual recalibration).
- [ ] Calibration is saved locally and persists across browser reloads.
- [ ] Clicking unrelated buttons does NOT trigger gaze tracking.
- [ ] State machine only allows valid transitions (no orphaned states).
- [ ] All errors are surfaced with helpful messaging.
- [ ] Recalibration can be triggered manually at any time.

---

## Certainty & Escalation

### High-Confidence Changes

You can proceed with:
- Creating the `GazeContext` + provider.
- Implementing the state machine.
- Setting up calibration persistence (local + Firebase).
- Building error handling and user messaging.

### Low-Confidence Scenarios

**Ask before proceeding if:**
- You need to understand the current WebGazer.js integration (how it's currently initialized, configured).
- You need to know the exact structure of the Firebase Firestore schema (are there existing calibration collections?).
- You are unsure whether to use Firestore or Realtime Database for calibration backup.
- You need to confirm which components currently render gaze UI and how they're triggered.

**Escalation questions:**
- "What is the current WebGazer initialization code? Where is it called?"
- "Is there existing Firebase Firestore schema for users/calibration? Should I extend it or create new?"
- "Are there existing state management libraries (Redux, Zustand, etc.) I should use, or is Context + useReducer preferred?"
- "Which components currently trigger gaze UI? Can I get their file paths?"

---

## Success Criteria

✅ **Completed when:**
- Gaze tracking is completely hidden for unauthenticated users.
- Gaze is only activatable by explicit user action (button click in control panel).
- Calibration persists across sessions (local storage + Firebase fallback).
- All gaze state is managed by a single state machine (no scattered booleans).
- Gaze UI never randomly reappears or gets triggered by accident.
- Errors are clearly surfaced with actionable messaging.
- State transitions are predictable and testable.

---

## Next Steps

1. **Agent 1** will design the right-panel control UI (where gaze buttons and status live).
2. **Agent 3** will ensure gaze data (heatmaps, engagement metrics) feed into Gemini for AI suggestions.
3. All agents coordinate on the overall UX flow (auth → onboarding → enable gaze → calibrate → track → view suggestions).

---

**End of Agent 2 Document**