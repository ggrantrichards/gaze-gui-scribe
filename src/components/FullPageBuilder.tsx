/**
 * Full Page Builder - v0/Bolt.new style interface
 * 
 * Complete page building experience with:
 * - Full-page generation from prompts
 * - Real-time gaze tracking on entire page
 * - Iterative section adding/editing
 * - Export complete projects
 */

import React, { useState, useCallback, useEffect } from 'react'
import { PageBuilderCanvas } from './PageBuilderCanvas'
import { useAIComponentGeneration } from '@/hooks/useAIComponentGeneration'
import type { ComponentNode, GazePoint } from '@/types'

export interface PageSection {
  id: string
  component: ComponentNode
  order: number
  gazeHeatmap?: GazePoint[]
}

interface FullPageBuilderProps {
  currentGaze?: GazePoint | null
  recentGazeData?: GazePoint[]
  onClose?: () => void
  projectId?: string | null
  projectName?: string
  onSaveSections?: (sections: PageSection[]) => void
  onAddMessage?: (role: 'user' | 'assistant', content: string) => void
  messages?: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: number
  }>
}

export function FullPageBuilder({
  currentGaze,
  recentGazeData,
  onClose,
  projectId,
  projectName,
  onSaveSections,
  onAddMessage,
  messages = []
}: FullPageBuilderProps) {
  const [sections, setSections] = useState<PageSection[]>([])
  const [prompt, setPrompt] = useState('')
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [showCode, setShowCode] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState<string>('')
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [totalSections, setTotalSections] = useState(0)
  const [sectionStatuses, setSectionStatuses] = useState<Array<{
    name: string
    status: 'pending' | 'generating' | 'completed' | 'error'
    timestamp?: number
  }>>([])

  // Debug logging
  useEffect(() => {
    console.log('🏗️ Page Builder mounted')
    return () => {
      console.log('🏗️ Page Builder unmounted')
    }
  }, [])

  // Debug: Watch sections state
  useEffect(() => {
    console.log('📋 Sections state changed:', sections.length, 'sections', sections)
  }, [sections])

  // Auto-save sections when they change
  useEffect(() => {
    if (sections.length > 0 && onSaveSections) {
      console.log('💾 Auto-saving sections to project...')
      onSaveSections(sections)
    }
  }, [sections, onSaveSections])

  const { generateComponent, isGenerating: isSingleGenerating, progress, error } = useAIComponentGeneration({
    gazeData: recentGazeData,
    onComponentGenerated: (component) => {
      console.log('🎉 Component generated callback fired!', component)
      // Add new section to page
      const newSection: PageSection = {
        id: `section-${Date.now()}`,
        component,
        order: sections.length
      }
      console.log('📦 New section:', newSection)
      setSections(prev => {
        const updated = [...prev, newSection]
        console.log('📊 Sections updated:', updated.length, 'sections')
        return updated
      })
    }
  })

  const handleGenerate = useCallback(async () => {
    console.log('🚀 handleGenerate called with prompt:', prompt)
    if (!prompt.trim()) {
      console.warn('⚠️ Empty prompt, skipping')
      return
    }
    if (isGenerating || isSingleGenerating) {
      console.warn('⚠️ Already generating, skipping')
      return
    }
    
    // Log user message
    if (onAddMessage) {
      onAddMessage('user', prompt)
    }
    
    // Check if this is a landing page request (should split into multiple sections)
    const landingPageKeywords = /landing page|full page|complete page|entire page|website|web page|full site|complete site/i
    const isLandingPageRequest = landingPageKeywords.test(prompt)
    
    if (isLandingPageRequest) {
      console.log('🏗️ Detected landing page request - using multi-section generation')
      
      setIsGenerating(true)
      setGenerationProgress('Analyzing your request...')
      setCurrentSectionIndex(0)
      
      // Initialize section statuses
      const expectedSections = [
        { name: 'Navigation', status: 'pending' as const },
        { name: 'Hero', status: 'pending' as const },
        { name: 'Features', status: 'pending' as const },
        { name: 'SocialProof', status: 'pending' as const },
        { name: 'Pricing', status: 'pending' as const },
        { name: 'CTA', status: 'pending' as const },
        { name: 'Footer', status: 'pending' as const }
      ]
      setSectionStatuses(expectedSections)
      
      try {
        // Call streaming multi-section API
        const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
        
        // Debug logging
        console.log('🔍 Backend URL:', backendURL)
        console.log('🔍 VITE_BACKEND_URL env var:', import.meta.env.VITE_BACKEND_URL)
        console.log('🔍 Full request URL:', `${backendURL}/api/generate-multi-section-stream`)
        console.log('🔍 Request payload:', { prompt, outputFormat: 'react' })
        
        setGenerationProgress('Connecting to AI...')
        
        console.log('🌐 Making fetch request to:', `${backendURL}/api/generate-multi-section-stream`)
        
        let response: Response
        try {
          response = await fetch(`${backendURL}/api/generate-multi-section-stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, outputFormat: 'react' })
          })
          console.log('📡 Response received:', response.status, response.statusText)
          console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))
        } catch (fetchError) {
          console.error('❌ Fetch failed:', fetchError)
          throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Failed to connect to backend'}`)
        }
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No error details')
          console.error('❌ API error:', response.status, response.statusText, errorText)
          throw new Error(`API error (${response.status}): ${response.statusText}. ${errorText}`)
        }
        
        if (!response.body) {
          console.error('❌ No response body')
          throw new Error('No response body - server may not support streaming')
        }
        
        console.log('✅ Response body available, starting stream read')
        
        setGenerationProgress('Receiving sections...')
        
        // Read streaming response
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let sectionIndex = 0
        let hasReceivedData = false
        
        console.log('📖 Starting to read stream...')
        
        while (true) {
          try {
            const { done, value } = await reader.read()
            
            if (done) {
              console.log('✅ Stream complete', hasReceivedData ? '(received data)' : '(no data received)')
              if (!hasReceivedData) {
                throw new Error('Stream closed without receiving any data. Backend may not be processing the request.')
              }
              break
            }
            
            if (value && value.length > 0) {
              hasReceivedData = true
              console.log('📦 Received chunk:', value.length, 'bytes')
              
              // Decode chunk and add to buffer
              buffer += decoder.decode(value, { stream: true })
              
              // Process complete messages (separated by \n\n)
              const messages = buffer.split('\n\n')
              buffer = messages.pop() || '' // Keep incomplete message in buffer
              
              for (const message of messages) {
                if (!message.trim() || !message.startsWith('data: ')) continue
                
                try {
                  const data = JSON.parse(message.slice(6)) // Remove 'data: ' prefix
                  console.log('📨 Received event:', data.type, data)
              
              if (data.type === 'init') {
                // Initialize section statuses with actual section names
                setTotalSections(data.total_sections)
                const statuses = data.section_names.map((name: string) => ({
                  name,
                  status: 'pending' as const
                }))
                setSectionStatuses(statuses)
                setGenerationProgress(`Preparing ${data.total_sections} sections...`)
                console.log(`🏗️ Initialized ${data.total_sections} sections:`, data.section_names)
                
              } else if (data.type === 'status' && data.status === 'generating') {
                // Update section to "generating" status
                const sectionName = data.section
                setSectionStatuses(prev => prev.map(s => 
                  s.name === sectionName 
                    ? { ...s, status: 'generating' as const, timestamp: Date.now() } 
                    : s
                ))
                setGenerationProgress(`Generating ${sectionName}...`)
                console.log(`⚙️ Generating ${sectionName}`)
                
              } else if (data.type === 'section_complete') {
                // Section completed - add to page and update status
                const sectionData = data.data
                const sectionName = data.section
                
                console.log(`✅ Section ${sectionName} completed, adding to page`)
                console.log(`📦 Section data:`, {
                  name: sectionName,
                  codeLength: sectionData.code?.length || 0,
                  order: sectionData.sectionOrder,
                  hasCode: !!sectionData.code
                })
                
                // Validate section data
                if (!sectionData.code || sectionData.code.trim().length === 0) {
                  console.error(`❌ Section ${sectionName} has no code!`)
                  setSectionStatuses(prev => prev.map(s => 
                    s.name === sectionName 
                      ? { ...s, status: 'error' as const, timestamp: Date.now() } 
                      : s
                  ))
                  return // Skip this section
                }
                
                // Use unique ID based on section name and order to prevent duplicates
                const sectionOrder = sectionData.sectionOrder !== undefined ? sectionData.sectionOrder : sectionIndex
                const uniqueId = `section-${sectionName.toLowerCase()}-${sectionOrder}-${Date.now()}`
                
                const newSection: PageSection = {
                  id: uniqueId,
                  component: {
                    id: `component-${sectionName.toLowerCase()}-${sectionOrder}`,
                    name: sectionData.sectionName || sectionName,
                    code: sectionData.code,
                    dependencies: sectionData.dependencies || []
                  },
                  order: sectionOrder
                }
                
                // Add section, avoiding duplicates by checking if section with same order already exists
                setSections(prev => {
                  // Check if section with this order already exists
                  const existingIndex = prev.findIndex(s => s.order === sectionOrder)
                  if (existingIndex >= 0) {
                    // Replace existing section at this order
                    const updated = [...prev]
                    updated[existingIndex] = newSection
                    console.log(`🔄 Replaced section at order ${sectionOrder}`)
                    return updated
                  } else {
                    // Add new section
                    console.log(`➕ Added new section: ${sectionName} at order ${sectionOrder}`)
                    return [...prev, newSection].sort((a, b) => a.order - b.order)
                  }
                })
                
                // Update status to completed
                setSectionStatuses(prev => prev.map(s => 
                  s.name === sectionName 
                    ? { ...s, status: 'completed' as const, timestamp: Date.now() } 
                    : s
                ))
                
                sectionIndex++
                setCurrentSectionIndex(sectionIndex)
                setGenerationProgress(`✅ ${sectionName} completed! (${sectionIndex}/${totalSections})`)
                console.log(`📊 Progress: ${sectionIndex}/${totalSections} sections completed`)
                
              } else if (data.type === 'complete') {
                // All sections generated
                console.log('🎉 All sections complete message received')
                console.log(`📊 Final count: ${sectionIndex} sections processed`)
                
                // Check if we're missing any sections by checking state
                setSectionStatuses(prev => {
                  const missingSections = prev.filter(s => s.status !== 'completed' && s.status !== 'error')
                  if (missingSections.length > 0) {
                    console.warn(`⚠️ ${missingSections.length} sections still pending:`, missingSections.map(s => s.name))
                  }
                  // Mark any remaining as completed (they might have been generated but not processed)
                  return prev.map(s => ({ ...s, status: 'completed' as const }))
                })
                
                // Get final section count from state
                setSections(prev => {
                  console.log(`📊 Final sections in state: ${prev.length}`)
                  setGenerationProgress(`✅ All sections generated! (${prev.length} total)`)
                  return prev
                })
                
                setTimeout(() => {
                  setGenerationProgress('')
                  setIsGenerating(false)
                }, 3000) // Longer delay to show completion
                
              } else if (data.type === 'error') {
                throw new Error(data.message || 'Generation error')
              }
                } catch (parseError) {
                  console.error('❌ Error parsing event:', parseError, message)
                }
              }
            }
          } catch (readError) {
            console.error('❌ Error reading stream:', readError)
            throw readError
          }
        }
      } catch (error) {
        console.error('❌ Multi-section generation failed:', error)
        console.error('❌ Error details:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : typeof error
        })
        setGenerationProgress(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        // Mark current section as error
        setSectionStatuses(prev => prev.map((s, i) => 
          i === currentSectionIndex - 1 ? { ...s, status: 'error' as const } : s
        ))
        setTimeout(() => {
          setGenerationProgress('')
          setIsGenerating(false)
          setSectionStatuses([])
        }, 5000) // Longer timeout so user can see the error
      } finally {
        console.log('🏁 handleGenerate finally block - generation process ended')
      }
    } else {
      // Single component generation (existing logic)
      console.log('🧩 Single component generation')
      setIsGenerating(true)
      setGenerationProgress('Generating component...')
      
      try {
        await generateComponent(prompt)
        setGenerationProgress('✅ Component generated!')
        setTimeout(() => {
          setGenerationProgress('')
          setIsGenerating(false)
        }, 2000)
      } catch (error) {
        setGenerationProgress(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setTimeout(() => {
          setGenerationProgress('')
          setIsGenerating(false)
        }, 3000)
      }
    }
    
    setPrompt('') // Clear after generation
  }, [prompt, isGenerating, isSingleGenerating, generateComponent])

  const handleSectionRemove = useCallback((sectionId: string) => {
    setSections(prev => prev.filter(s => s.id !== sectionId))
  }, [])

  const handleSectionReorder = useCallback((sectionId: string, newOrder: number) => {
    setSections(prev => {
      const section = prev.find(s => s.id === sectionId)
      if (!section) return prev
      
      const filtered = prev.filter(s => s.id !== sectionId)
      const clampedOrder = Math.max(0, Math.min(newOrder, filtered.length))
      
      const reordered = [
        ...filtered.slice(0, clampedOrder),
        { ...section, order: clampedOrder },
        ...filtered.slice(clampedOrder)
      ]
      
      return reordered.map((s, i) => ({ ...s, order: i }))
    })
  }, [])
  
  // CORE FEATURE: Update section code after AI suggestion is applied
  const handleSectionUpdate = useCallback((sectionId: string, newCode: string) => {
    console.log('🔄 Updating section:', sectionId)
    setSections(prev => prev.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          component: {
            ...s.component,
            code: newCode,
            lastUpdated: Date.now()
          }
        }
      }
      return s
    }))
  }, [])

  const handleExportCode = useCallback(() => {
    const fullCode = sections
      .sort((a, b) => a.order - b.order)
      .map(s => s.component.code)
      .join('\n\n')
    
    // Copy to clipboard
    navigator.clipboard.writeText(fullCode)
    alert('Full page code copied to clipboard!')
  }, [sections])

  const [isExporting, setIsExporting] = useState(false)
  
  const handleExportProject = useCallback(async () => {
    if (sections.length === 0) {
      alert('⚠️ No sections to export! Generate some components first.')
      return
    }
    
    setIsExporting(true)
    
    try {
      const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
      
      const response = await fetch(`${backendURL}/api/export-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: sections.map(s => ({
            code: s.component.code,
            name: s.component.name,
            description: `${s.component.name} section`
          })),
          projectType: "nextjs",  // Could add UI to let user choose
          projectName: `gaze-project-${Date.now()}`
        })
      })
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`)
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gaze-project-${Date.now()}.zip`
      a.click()
      window.URL.revokeObjectURL(url)
      
      alert('✅ TypeScript project exported successfully! 🎉\n\nExtract the ZIP and run:\n  npm install\n  npm run dev')
    } catch (error) {
      console.error('Export error:', error)
      alert(`❌ Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsExporting(false)
    }
  }, [sections])
  
  const handleExportHTML = useCallback(() => {
    const componentsCode = sections
      .sort((a, b) => a.order - b.order)
      .map(s => s.component.code.replace(/^export\s+(default\s+)?/gm, ''))
      .join('\n\n')
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Page</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect } = React;
    
    ${componentsCode}
    
    function App() {
      return (
        <div>
          ${sections.map(s => {
            const name = s.component.name
            return `<${name} />`
          }).join('\n          ')}
        </div>
      )
    }
    
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>`
    
    // Download as HTML file
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'generated-page.html'
    a.click()
    URL.revokeObjectURL(url)
  }, [sections])

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col" style={{ zIndex: 10000 }}>
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {projectName || 'Page Builder'}
            </h1>
            <span className="text-sm text-slate-400">
              {sections.length} section{sections.length !== 1 ? 's' : ''} 
              {projectId && <span className="ml-2 text-slate-500">• Saved</span>}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <button
            onClick={() => setShowCode(!showCode)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showCode
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {showCode ? '👁️ Preview' : '💻 Code'}
          </button>

          {/* Export Buttons */}
          {sections.length > 0 && (
            <>
              <button
                onClick={handleExportCode}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium"
              >
                📋 Copy Code
              </button>
              <button
                onClick={handleExportProject}
                disabled={isExporting}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                {isExporting ? '⏳ Exporting...' : '📦 Export TypeScript Project'}
              </button>
            </>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas / Code View - Full Width, Clean Design */}
        <div className="flex-1 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
          {showCode ? (
            <div className="h-full overflow-auto p-6">
              {sections.sort((a, b) => a.order - b.order).map(section => (
                <div key={section.id} className="mb-6 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{section.order + 1}</span>
                      <div>
                        <div className="font-bold text-white">{section.component.name}</div>
                        <div className="text-xs text-blue-100">React Component</div>
                      </div>
                    </div>
                    <div className="text-xs text-blue-100">{section.component.code.length} characters</div>
                  </div>
                  <div className="p-6">
                    <pre className="text-sm overflow-auto bg-slate-900 text-slate-100 p-4 rounded-lg font-mono">
                      {section.component.code}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <PageBuilderCanvas
              sections={sections}
              onSectionClick={setSelectedSection}
              onSectionRemove={handleSectionRemove}
              onSectionReorder={handleSectionReorder}
              onSectionUpdate={handleSectionUpdate}
              currentGaze={currentGaze}
            />
          )}
        </div>

        {/* Sidebar - Generation Panel - v0/Bolt.new Style */}
        <div className="w-[420px] bg-white border-l border-slate-200 flex flex-col shadow-2xl">
          <div className="p-6 border-b border-slate-200 bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                ✨
              </div>
              <h2 className="text-xl font-bold text-slate-800">AI Generator</h2>
            </div>
            <p className="text-sm text-slate-600">Describe what you want to build</p>
            
            {/* Prompt Input - v0 Style */}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleGenerate()
                }
              }}
              placeholder="Describe what you want to build...&#10;&#10;Examples:&#10;• Create a landing page for a SaaS product&#10;• Add a pricing section with 3 tiers&#10;• Build a hero section with gradient background"
              className="w-full h-40 px-4 py-3 mt-4 bg-white border-2 border-slate-200 text-slate-800 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm placeholder-slate-400 shadow-sm"
              disabled={isGenerating}
            />

            {/* Generate Button - v0 Style */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || isSingleGenerating || !prompt.trim()}
              className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {(isGenerating || isSingleGenerating) ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⚙️</span>
                  <span>Generating...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>✨</span>
                  <span>Generate with AI</span>
                </span>
              )}
            </button>
            
            {/* Progress Indicator - Enhanced */}
            {(isGenerating || isSingleGenerating) && (
              <div className="mt-4 p-5 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative w-8 h-8">
                    <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                    <div className="absolute inset-2 rounded-full bg-white"></div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-800">
                      {generationProgress || 'Processing...'}
                    </div>
                    {totalSections > 0 && (
                      <div className="text-xs text-slate-600 mt-1 font-medium">
                        Section {currentSectionIndex} of {totalSections}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Section Status Tracker - NEW! */}
                {sectionStatuses.length > 0 && (
                  <div className="mb-4 space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {sectionStatuses.map((section, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 transition-all duration-300 ${
                          section.status === 'completed'
                            ? 'bg-green-50 border-green-300 shadow-sm'
                            : section.status === 'generating'
                            ? 'bg-blue-50 border-blue-400 shadow-md animate-pulse'
                            : section.status === 'error'
                            ? 'bg-red-50 border-red-300'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                          {section.status === 'completed' ? (
                            <span className="text-green-600 text-lg font-bold animate-bounce">✓</span>
                          ) : section.status === 'generating' ? (
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : section.status === 'error' ? (
                            <span className="text-red-600 text-lg font-bold">✗</span>
                          ) : (
                            <span className="text-slate-300 text-sm font-bold">○</span>
                          )}
                        </div>
                        
                        <span className={`flex-1 text-sm font-semibold ${
                          section.status === 'completed'
                            ? 'text-green-700'
                            : section.status === 'generating'
                            ? 'text-blue-700'
                            : section.status === 'error'
                            ? 'text-red-700'
                            : 'text-slate-400'
                        }`}>
                          {section.name}
                        </span>
                        
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          section.status === 'completed'
                            ? 'bg-green-200 text-green-800'
                            : section.status === 'generating'
                            ? 'bg-blue-200 text-blue-800'
                            : section.status === 'error'
                            ? 'bg-red-200 text-red-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {section.status === 'completed' ? 'Done' : section.status === 'generating' ? 'Generating' : section.status === 'error' ? 'Failed' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                {totalSections > 0 && (
                  <div className="relative">
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 shadow-lg"
                        style={{ width: `${(currentSectionIndex / totalSections) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-slate-600 mt-2 text-right font-semibold">
                      {Math.round((currentSectionIndex / totalSections) * 100)}%
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error Display - Enhanced */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-800 text-sm shadow-lg">
                <div className="flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <div className="flex-1">
                    <div className="font-semibold mb-1">Generation Error</div>
                    <div>{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Templates */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">Quick Templates</h3>
              <div className="space-y-2">
                {[
                  'Create a modern landing page',
                  'Add a hero section with CTA',
                  'Add a features section',
                  'Add a pricing table',
                  'Add a contact form',
                  'Add a footer with links'
                ].map((template) => (
                  <button
                    key={template}
                    onClick={() => setPrompt(template)}
                    className="w-full text-left px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded transition-colors"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Gaze Insights */}
          {currentGaze && (
            <div className="p-6 border-t border-slate-700">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">👁️ Gaze Tracking Active</h3>
              <div className="text-xs text-slate-500">
                <p>Position: {Math.round(currentGaze.x)}, {Math.round(currentGaze.y)}</p>
                <p className="mt-2 text-slate-400">
                  Your eye movements are being tracked to optimize component placement and design.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

