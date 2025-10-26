/**
 * Project Sidebar - bolt.new / v0 / lovable style
 * 
 * Shows list of user's saved projects/chats
 * Allows switching between projects
 * Shows project metadata and preview
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  FolderOpen, 
  Trash2, 
  Clock, 
  Eye, 
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'

export interface SavedProject {
  id: string
  name: string
  description?: string
  sections: any[]
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: number
  }>
  createdAt: number
  updatedAt: number
  thumbnail?: string
}

interface ProjectSidebarProps {
  projects: SavedProject[]
  currentProjectId?: string | null
  onSelectProject: (projectId: string) => void
  onNewProject: () => void
  onDeleteProject: (projectId: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function ProjectSidebar({
  projects,
  currentProjectId,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  isCollapsed = false,
  onToggleCollapse
}: ProjectSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'name'>('updated')

  // Filter and sort projects
  const filteredProjects = projects
    .filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'created') return b.createdAt - a.createdAt
      return b.updatedAt - a.updatedAt
    })

  if (isCollapsed) {
    return (
      <div className="w-16 bg-slate-900 border-r border-slate-700 flex flex-col items-center py-4 gap-4">
        <Button
          onClick={onToggleCollapse}
          variant="ghost"
          size="sm"
          className="w-10 h-10 p-0"
        >
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </Button>
        
        <Button
          onClick={onNewProject}
          variant="ghost"
          size="sm"
          className="w-10 h-10 p-0 hover:bg-blue-600/20"
        >
          <Plus className="w-5 h-5 text-blue-400" />
        </Button>

        <div className="flex-1 flex flex-col gap-2 w-full px-2 overflow-y-auto">
          {projects.slice(0, 5).map((project) => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                currentProjectId === project.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
              title={project.name}
            >
              <FolderOpen className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-400" />
            <h2 className="font-semibold text-white">Projects</h2>
          </div>
          <div className="flex items-center gap-1">
            <Button
              onClick={onNewProject}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white h-8"
            >
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
            <Button
              onClick={onToggleCollapse}
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0"
            >
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-9"
          />
        </div>

        {/* Sort */}
        <div className="flex gap-2 mt-2">
          {[
            { value: 'updated', label: 'Recent' },
            { value: 'created', label: 'Created' },
            { value: 'name', label: 'Name' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value as any)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                sortBy === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm mb-2">
                {searchQuery ? 'No projects found' : 'No projects yet'}
              </p>
              <p className="text-slate-500 text-xs mb-4">
                {searchQuery ? 'Try a different search term' : 'Create your first project to get started'}
              </p>
              {!searchQuery && (
                <Button
                  onClick={onNewProject}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New Project
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isActive={currentProjectId === project.id}
                  onSelect={() => onSelectProject(project.id)}
                  onDelete={() => onDeleteProject(project.id)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="p-3 border-t border-slate-700 bg-slate-900/50">
        <div className="text-xs text-slate-400 flex items-center justify-between">
          <span>{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Updated {projects.length > 0 ? formatDistanceToNow(projects[0].updatedAt, { addSuffix: true }) : 'never'}
          </span>
        </div>
      </div>
    </div>
  )
}

function ProjectCard({
  project,
  isActive,
  onSelect,
  onDelete
}: {
  project: SavedProject
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`relative rounded-lg border-2 transition-all cursor-pointer group ${
        isActive
          ? 'bg-blue-900/20 border-blue-500 shadow-lg'
          : 'bg-slate-800 border-slate-700 hover:border-slate-600 hover:bg-slate-750'
      }`}
      onClick={onSelect}
    >
      <div className="p-3">
        {/* Project Name */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className={`font-medium text-sm line-clamp-2 ${
            isActive ? 'text-white' : 'text-slate-200'
          }`}>
            {project.name || 'Untitled Project'}
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowDeleteConfirm(true)
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
          >
            <Trash2 className="w-3 h-3 text-red-400" />
          </button>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-2">
            {project.description}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {project.sections.length} section{project.sections.length !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {project.messages.length} message{project.messages.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Timestamp */}
        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDistanceToNow(project.updatedAt, { addSuffix: true })}
        </div>
      </div>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/95 rounded-lg flex flex-col items-center justify-center p-4 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-white mb-3 text-center">
              Delete this project?
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDeleteConfirm(false)
                }}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                  setShowDeleteConfirm(false)
                }}
                className="h-7 text-xs bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

