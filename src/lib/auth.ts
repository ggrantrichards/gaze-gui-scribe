/**
 * Authentication Utilities
 * Handles user authentication, session management, and profile operations
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  User,
  UserCredential,
  signInWithRedirect,
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from './firebase'

export interface UserProfile {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
  createdAt: any
  lastLoginAt: any
  onboardingCompleted: boolean
  calibrationCompleted: boolean
  preferences: {
    theme: 'light' | 'dark' | 'system'
    defaultModel: string
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<UserCredential> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  
  // Update profile with display name
  if (displayName && userCredential.user) {
    await updateProfile(userCredential.user, { displayName })
  }
  
  // Send email verification
  await sendEmailVerification(userCredential.user)
  
  // Create user profile in Firestore
  await createUserProfile(userCredential.user)
  
  return userCredential
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  
  // Update last login time
  await updateLastLogin(userCredential.user.uid)
  
  return userCredential
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
  try {
    return await signInWithPopup(auth, googleProvider)
  } catch (error: any) {
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
      console.warn('Popup failed, falling back to redirect login')
      await signInWithRedirect(auth, googleProvider)
    } else {
      throw error
    }
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}

/**
 * Create user profile in Firestore
 */
async function createUserProfile(user: User): Promise<void> {
  const userProfile: UserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    onboardingCompleted: false,
    calibrationCompleted: false,
    preferences: {
      theme: 'system',
      defaultModel: 'auto'
    }
  }
  
  await setDoc(doc(db, 'users', user.uid), userProfile)
}

/**
 * Update last login time
 */
async function updateLastLogin(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    lastLoginAt: serverTimestamp()
  })
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userDoc = await getDoc(doc(db, 'users', uid))
  
  if (userDoc.exists()) {
    return userDoc.data() as UserProfile
  }
  
  return null
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), updates as any)
}

/**
 * Mark onboarding as completed
 */
export async function completeOnboarding(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    onboardingCompleted: true
  })
}

/**
 * Mark calibration as completed
 */
export async function completeCalibration(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    calibrationCompleted: true
  })
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return auth.currentUser !== null
}

