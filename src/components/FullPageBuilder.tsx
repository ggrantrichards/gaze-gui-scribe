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

interface PageSection {
  id: string
  component: ComponentNode
  order: number
  gazeHeatmap?: GazePoint[]
}

interface FullPageBuilderProps {
  currentGaze?: GazePoint | null
  recentGazeData?: GazePoint[]
  onClose?: () => void
}

export function FullPageBuilder({
  currentGaze,
  recentGazeData,
  onClose
}: FullPageBuilderProps) {
  const [sections, setSections] = useState<PageSection[]>([])
  const [prompt, setPrompt] = useState('')
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [showCode, setShowCode] = useState(false)

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

  const { generateComponent, isGenerating, progress, error } = useAIComponentGeneration({
    gazeData: recentGazeData,
    onComponentGenerated: (component: ComponentNode) => {
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
    if (isGenerating) {
      console.warn('⚠️ Already generating, skipping')
      return
    }
    
    console.log('✨ Calling generateComponent...')
    await generateComponent(prompt)
    console.log('✅ generateComponent completed')
    setPrompt('') // Clear after generation
  }, [prompt, isGenerating, generateComponent])

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

  const handleExportCode = useCallback(() => {
    const fullCode = sections
      .sort((a, b) => a.order - b.order)
      .map(s => s.component.code)
      .join('\n\n')
    
    // Copy to clipboard
    navigator.clipboard.writeText(fullCode)
    alert('Full page code copied to clipboard!')
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
          <h1 className="text-2xl font-bold text-white">Page Builder</h1>
          <span className="text-sm text-slate-400">
            {sections.length} section{sections.length !== 1 ? 's' : ''}
          </span>
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
                onClick={handleExportHTML}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
              >
                ⬇️ Download HTML
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
        {/* Canvas / Code View */}
        <div className="flex-1 overflow-auto bg-gray-50">
          {showCode ? (
            <div className="p-4 font-mono text-sm">
              {(sections || []).sort((a, b) => a.order - b.order).map(section => (
                <div key={section.id} className="mb-6 bg-white p-4 rounded-lg shadow">
                  <div className="text-xs text-gray-500 mb-2">{section.component?.name || 'Unknown'}</div>
                  <pre className="text-xs overflow-auto">{section.component?.code || 'No code available'}</pre>
                </div>
              ))}
            </div>
          ) : (
            <PageBuilderCanvas
              sections={sections || []}
              onSectionClick={setSelectedSection}
              onSectionRemove={handleSectionRemove}
              onSectionReorder={handleSectionReorder}
              currentGaze={currentGaze}
            />
          )}
        </div>

        {/* Sidebar - Generation Panel */}
        <div className="w-96 bg-slate-800 border-l border-slate-700 flex flex-col">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-lg font-bold text-white mb-4">Generate Sections</h2>
            
            {/* Prompt Input */}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleGenerate()
                }
              }}
              placeholder="Describe what you want to build...&#10;&#10;Examples:&#10;• Create a landing page for a SaaS product&#10;• Add a pricing section with 3 tiers&#10;• Build a hero section with gradient background"
              className="w-full h-32 px-4 py-3 bg-slate-900 text-white rounded-lg resize-none focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              disabled={isGenerating}
            />

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⚙️</span>
                  {progress || 'Generating...'}
                </span>
              ) : (
                '✨ Generate Section'
              )}
            </button>

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-200 text-sm">
                {error}
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

