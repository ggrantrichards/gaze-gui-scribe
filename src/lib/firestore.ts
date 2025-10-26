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

