/**
 * Full Page Builder with Project Management
 * 
 * Integrates project/chat history sidebar with the page builder
 * Handles saving, loading, and switching between projects
 */

import React, { useState, useCallback, useEffect } from 'react'
import { FullPageBuilder, PageSection } from './FullPageBuilder'
import { ProjectSidebar, SavedProject } from './ProjectSidebar'
import { useAuth } from '@/contexts/AuthContext'
import {
  createProject,
  getUserProjects,
  getProject,
  updateProject,
  deleteProject,
  addSectionToProject,
  touchProject,
  Project,
  ProjectSection
} from '@/lib/firestore'
import { Timestamp } from 'firebase/firestore'
import type { GazePoint } from '@/types'
import { Loader2 } from 'lucide-react'

interface FullPageBuilderWithProjectsProps {
  currentGaze?: GazePoint | null
  recentGazeData?: GazePoint[]
  onClose?: () => void
}

export function FullPageBuilderWithProjects({
  currentGaze,
  recentGazeData,
  onClose
}: FullPageBuilderWithProjectsProps) {
  const { user } = useAuth()
  const [projects, setProjects] = useState<SavedProject[]>([])
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: number
  }>>([])

  // Load user's projects on mount
  useEffect(() => {
    if (!user) return

    const loadProjects = async () => {
      try {
        setIsLoadingProjects(true)
        const userProjects = await getUserProjects(user.uid)
        
        // Convert Firestore Projects to SavedProjects for sidebar
        const savedProjects: SavedProject[] = userProjects.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          sections: p.sections,
          messages: [], // Messages loaded separately when project is selected
          createdAt: p.createdAt instanceof Timestamp ? p.createdAt.toMillis() : Date.now(),
          updatedAt: p.updatedAt instanceof Timestamp ? p.updatedAt.toMillis() : Date.now()
        }))
        
        setProjects(savedProjects)
        
        // Auto-select the most recent project or create a new one
        if (savedProjects.length > 0) {
          await handleSelectProject(savedProjects[0].id)
        } else {
          await handleNewProject()
        }
      } catch (error) {
        console.error('Failed to load projects:', error)
      } finally {
        setIsLoadingProjects(false)
      }
    }

    loadProjects()
  }, [user])

  // Handle creating a new project
  const handleNewProject = useCallback(async () => {
    if (!user) return

    try {
      const projectName = `Untitled Project ${new Date().toLocaleString()}`
      const projectId = await createProject(
        user.uid,
        projectName,
        'landing-page',
        'New project created'
      )
      
      // Reload projects
      const userProjects = await getUserProjects(user.uid)
      const savedProjects: SavedProject[] = userProjects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        sections: p.sections,
        messages: [],
        createdAt: p.createdAt instanceof Timestamp ? p.createdAt.toMillis() : Date.now(),
        updatedAt: p.updatedAt instanceof Timestamp ? p.updatedAt.toMillis() : Date.now()
      }))
      
      setProjects(savedProjects)
      setCurrentProjectId(projectId)
      setMessages([])
      
      // Load the new project
      const project = await getProject(projectId)
      setCurrentProject(project)
      
      console.log(`[Projects] Created new project: ${projectId}`)
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }, [user])

  // Handle selecting an existing project
  const handleSelectProject = useCallback(async (projectId: string) => {
    if (!user) return

    try {
      const project = await getProject(projectId)
      
      if (project) {
        setCurrentProject(project)
        setCurrentProjectId(projectId)
        setMessages([]) // TODO: Load chat messages from chat sessions
        
        // Update last accessed time
        await touchProject(projectId)
        
        console.log(`[Projects] Loaded project: ${projectId}`)
      }
    } catch (error) {
      console.error('Failed to load project:', error)
    }
  }, [user])

  // Handle deleting a project
  const handleDeleteProject = useCallback(async (projectId: string) => {
    if (!user) return

    try {
      await deleteProject(projectId)
      
      // Remove from local state
      setProjects(prev => prev.filter(p => p.id !== projectId))
      
      // If deleted project was current, create a new one
      if (projectId === currentProjectId) {
        const remaining = projects.filter(p => p.id !== projectId)
        if (remaining.length > 0) {
          await handleSelectProject(remaining[0].id)
        } else {
          await handleNewProject()
        }
      }
      
      console.log(`[Projects] Deleted project: ${projectId}`)
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }, [user, currentProjectId, projects, handleSelectProject, handleNewProject])

  // Handle saving sections to current project
  const handleSaveSections = useCallback(async (sections: any[]) => {
    if (!currentProjectId || !user) return

    try {
      const projectSections: ProjectSection[] = sections.map((section, index) => ({
        id: section.id,
        name: section.component.name || `Section ${index + 1}`,
        code: section.component.code,
        order: section.order || index,
        componentType: section.component.type || 'functional',
        dependencies: section.component.dependencies || []
      }))
      
      await updateProject(currentProjectId, {
        sections: projectSections,
        lastAccessedAt: Timestamp.now()
      })
      
      console.log(`[Projects] Saved ${sections.length} sections to project ${currentProjectId}`)
    } catch (error) {
      console.error('Failed to save sections:', error)
    }
  }, [currentProjectId, user])

  // Handle adding a message to chat history
  const handleAddMessage = useCallback(async (role: 'user' | 'assistant', content: string) => {
    if (!currentProjectId) return

    const newMessage = {
      role,
      content,
      timestamp: Date.now()
    }
    
    setMessages(prev => [...prev, newMessage])
    
    // TODO: Save to Firestore chat session
    console.log(`[Chat] Added ${role} message`)
  }, [currentProjectId])

  if (isLoadingProjects) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading your projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen flex overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      {/* Project Sidebar */}
      <ProjectSidebar
        projects={projects}
        currentProjectId={currentProjectId}
        onSelectProject={handleSelectProject}
        onNewProject={handleNewProject}
        onDeleteProject={handleDeleteProject}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      {/* Main Page Builder */}
      <div className="flex-1 overflow-hidden">
        <FullPageBuilder
          currentGaze={currentGaze}
          recentGazeData={recentGazeData}
          onClose={onClose}
          projectId={currentProjectId}
          projectName={currentProject?.name}
          onSaveSections={handleSaveSections}
          onAddMessage={handleAddMessage}
          messages={messages}
        />
      </div>
    </div>
  )
}

