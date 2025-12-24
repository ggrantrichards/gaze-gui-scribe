/**
 * Firestore Data Models and Operations
 * Handles projects, chats, and component storage
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from './firebase'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Project {
  id: string
  userId: string
  name: string
  description?: string
  type: 'landing-page' | 'component' | 'full-app'
  sections: ProjectSection[]
  createdAt: Timestamp
  updatedAt: Timestamp
  lastAccessedAt: Timestamp
  isStarred: boolean
  tags: string[]
}

export interface ProjectSection {
  id: string
  name: string
  code: string
  order: number
  componentType: string
  dependencies: string[]
}

export interface ChatMessage {
  id: string
  projectId: string
  userId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Timestamp
  metadata?: {
    model?: string
    tokens?: number
    generationType?: 'component' | 'section' | 'edit'
  }
}

export interface ChatSession {
  id: string
  projectId: string
  userId: string
  messages: ChatMessage[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================================================
// PROJECT OPERATIONS
// ============================================================================

/**
 * Create a new project
 */
export async function createProject(
  userId: string,
  name: string,
  type: Project['type'],
  description?: string
): Promise<string> {
  const projectRef = doc(collection(db, 'projects'))
  const projectId = projectRef.id
  
  const project: Omit<Project, 'id'> = {
    userId,
    name,
    description,
    type,
    sections: [],
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
    lastAccessedAt: serverTimestamp() as Timestamp,
    isStarred: false,
    tags: []
  }
  
  await setDoc(projectRef, project)
  
  return projectId
}

/**
 * Get all projects for a user
 */
export async function getUserProjects(userId: string): Promise<Project[]> {
  const q = query(
    collection(db, 'projects'),
    where('userId', '==', userId),
    orderBy('lastAccessedAt', 'desc')
  )
  
  const querySnapshot = await getDocs(q)
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Project[]
}

/**
 * Get a specific project
 */
export async function getProject(projectId: string): Promise<Project | null> {
  const projectDoc = await getDoc(doc(db, 'projects', projectId))
  
  if (projectDoc.exists()) {
    return {
      id: projectDoc.id,
      ...projectDoc.data()
    } as Project
  }
  
  return null
}

/**
 * Update project
 */
export async function updateProject(
  projectId: string,
  updates: Partial<Omit<Project, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, 'projects', projectId), {
    ...updates,
    updatedAt: serverTimestamp()
  })
}

/**
 * Delete project
 */
export async function deleteProject(projectId: string): Promise<void> {
  // Delete project
  await deleteDoc(doc(db, 'projects', projectId))
  
  // Delete associated chat sessions
  const chatQuery = query(
    collection(db, 'chatSessions'),
    where('projectId', '==', projectId)
  )
  const chatDocs = await getDocs(chatQuery)
  
  await Promise.all(
    chatDocs.docs.map(doc => deleteDoc(doc.ref))
  )
}

/**
 * Add section to project
 */
export async function addSectionToProject(
  projectId: string,
  section: ProjectSection
): Promise<void> {
  const project = await getProject(projectId)
  
  if (!project) {
    throw new Error('Project not found')
  }
  
  const updatedSections = [...project.sections, section]
  
  await updateProject(projectId, {
    sections: updatedSections,
    lastAccessedAt: serverTimestamp() as Timestamp
  })
}

/**
 * Update section in project
 */
export async function updateProjectSection(
  projectId: string,
  sectionId: string,
  updates: Partial<ProjectSection>
): Promise<void> {
  const project = await getProject(projectId)
  
  if (!project) {
    throw new Error('Project not found')
  }
  
  const updatedSections = project.sections.map(section =>
    section.id === sectionId ? { ...section, ...updates } : section
  )
  
  await updateProject(projectId, {
    sections: updatedSections,
    lastAccessedAt: serverTimestamp() as Timestamp
  })
}

/**
 * Remove section from project
 */
export async function removeSectionFromProject(
  projectId: string,
  sectionId: string
): Promise<void> {
  const project = await getProject(projectId)
  
  if (!project) {
    throw new Error('Project not found')
  }
  
  const updatedSections = project.sections.filter(
    section => section.id !== sectionId
  )
  
  await updateProject(projectId, {
    sections: updatedSections
  })
}

// ============================================================================
// CHAT OPERATIONS
// ============================================================================

/**
 * Create a new chat session
 */
export async function createChatSession(
  userId: string,
  projectId: string
): Promise<string> {
  const sessionRef = doc(collection(db, 'chatSessions'))
  const sessionId = sessionRef.id
  
  const session: Omit<ChatSession, 'id'> = {
    projectId,
    userId,
    messages: [],
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp
  }
  
  await setDoc(sessionRef, session)
  
  return sessionId
}

/**
 * Add message to chat session
 */
export async function addChatMessage(
  sessionId: string,
  message: Omit<ChatMessage, 'id' | 'timestamp'>
): Promise<void> {
  const session = await getDoc(doc(db, 'chatSessions', sessionId))
  
  if (!session.exists()) {
    throw new Error('Chat session not found')
  }
  
  const sessionData = session.data() as ChatSession
  
  const newMessage: ChatMessage = {
    ...message,
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: serverTimestamp() as Timestamp
  }
  
  const updatedMessages = [...sessionData.messages, newMessage]
  
  await updateDoc(doc(db, 'chatSessions', sessionId), {
    messages: updatedMessages,
    updatedAt: serverTimestamp()
  })
}

/**
 * Get chat session
 */
export async function getChatSession(sessionId: string): Promise<ChatSession | null> {
  const sessionDoc = await getDoc(doc(db, 'chatSessions', sessionId))
  
  if (sessionDoc.exists()) {
    return {
      id: sessionDoc.id,
      ...sessionDoc.data()
    } as ChatSession
  }
  
  return null
}

/**
 * Get all chat sessions for a project
 */
export async function getProjectChatSessions(projectId: string): Promise<ChatSession[]> {
  const q = query(
    collection(db, 'chatSessions'),
    where('projectId', '==', projectId),
    orderBy('updatedAt', 'desc')
  )
  
  const querySnapshot = await getDocs(q)
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as ChatSession[]
}

/**
 * Delete chat session
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
  await deleteDoc(doc(db, 'chatSessions', sessionId))
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Update last accessed time for a project
 */
export async function touchProject(projectId: string): Promise<void> {
  await updateDoc(doc(db, 'projects', projectId), {
    lastAccessedAt: serverTimestamp()
  })
}

/**
 * Toggle star status for a project
 */
export async function toggleProjectStar(projectId: string): Promise<void> {
  const project = await getProject(projectId)
  
  if (!project) {
    throw new Error('Project not found')
  }
  
  await updateDoc(doc(db, 'projects', projectId), {
    isStarred: !project.isStarred
  })
}

// ============================================================================
// CALIBRATION OPERATIONS
// ============================================================================

/**
 * Calibration data stored in Firebase
 * Note: We only store metadata, not the raw WebGazer data (privacy + size concerns)
 */
export interface CalibrationMetadata {
  userId: string
  timestamp: number
  accuracy: number
  deviceFingerprint: string
  browserInfo: {
    userAgent: string
    screenWidth: number
    screenHeight: number
  }
  createdAt: Timestamp
  updatedAt: Timestamp
}

/**
 * Generate a device fingerprint for identifying calibrations across sessions
 * This is a simple hash of browser/screen info - not for tracking, just for matching calibrations
 */
export function generateDeviceFingerprint(): string {
  const info = {
    userAgent: navigator.userAgent,
    screen: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language
  }
  // Simple hash - not cryptographically secure, just for matching
  return btoa(JSON.stringify(info)).slice(0, 32)
}

/**
 * Save calibration metadata to Firebase
 * Stored at: users/{userId}/calibration/latest
 */
export async function saveCalibrationToFirebase(
  userId: string,
  accuracy: number
): Promise<void> {
  const deviceFingerprint = generateDeviceFingerprint()
  
  const calibrationData: Omit<CalibrationMetadata, 'createdAt' | 'updatedAt'> & { 
    createdAt: ReturnType<typeof serverTimestamp>
    updatedAt: ReturnType<typeof serverTimestamp> 
  } = {
    userId,
    timestamp: Date.now(),
    accuracy,
    deviceFingerprint,
    browserInfo: {
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
  
  // Save to users/{userId}/calibration/latest
  const calibrationRef = doc(db, 'users', userId, 'calibration', 'latest')
  await setDoc(calibrationRef, calibrationData)
  
  console.log('[Firestore] Calibration metadata saved to Firebase')
}

/**
 * Load calibration metadata from Firebase
 * Returns null if no calibration exists or if it's too old (>30 days)
 */
export async function loadCalibrationFromFirebase(
  userId: string
): Promise<CalibrationMetadata | null> {
  try {
    const calibrationRef = doc(db, 'users', userId, 'calibration', 'latest')
    const calibrationDoc = await getDoc(calibrationRef)
    
    if (!calibrationDoc.exists()) {
      console.log('[Firestore] No calibration found in Firebase')
      return null
    }
    
    const data = calibrationDoc.data() as CalibrationMetadata
    
    // Check if calibration is too old (>30 days)
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
    if (Date.now() - data.timestamp > THIRTY_DAYS_MS) {
      console.log('[Firestore] Calibration is older than 30 days, considered stale')
      return null
    }
    
    // Check if device fingerprint matches (same device/screen)
    const currentFingerprint = generateDeviceFingerprint()
    if (data.deviceFingerprint !== currentFingerprint) {
      console.log('[Firestore] Calibration from different device/screen, may need recalibration')
      // Still return the data, but caller can decide whether to use it
    }
    
    console.log('[Firestore] Calibration metadata loaded from Firebase')
    return data
  } catch (error) {
    console.error('[Firestore] Error loading calibration from Firebase:', error)
    return null
  }
}

/**
 * Delete calibration data from Firebase
 */
export async function deleteCalibrationFromFirebase(userId: string): Promise<void> {
  try {
    const calibrationRef = doc(db, 'users', userId, 'calibration', 'latest')
    await deleteDoc(calibrationRef)
    console.log('[Firestore] Calibration deleted from Firebase')
  } catch (error) {
    console.error('[Firestore] Error deleting calibration from Firebase:', error)
  }
}

/**
 * Check if user has valid calibration in Firebase
 */
export async function hasValidCalibration(userId: string): Promise<boolean> {
  const calibration = await loadCalibrationFromFirebase(userId)
  return calibration !== null
}

