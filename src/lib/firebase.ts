/**
 * Firebase Configuration and Initialization
 * Project: ClientSight
 * Project ID: clientsight-5a400
 * Project Number: 363801379697
 */

import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getAnalytics, isSupported } from 'firebase/analytics'

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "clientsight-5a400.firebaseapp.com",
  projectId: "clientsight-5a400",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "clientsight-5a400.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "363801379697",
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

// Initialize Firebase (singleton pattern)
// const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

// Initialize services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()


// Initialize Analytics (only in browser)
export const analytics = typeof window !== 'undefined' 
  ? isSupported().then(yes => yes ? getAnalytics(app) : null)
  : Promise.resolve(null)

// Connect to emulators in development (optional)
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099')
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectStorageEmulator(storage, 'localhost', 9199)
}

// Google Auth configuration
googleProvider.setCustomParameters({
  prompt: 'select_account'
})

export default app