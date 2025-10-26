/**
 * Page Builder Canvas - Full-page builder like v0/Bolt.new
 * 
 * Displays complete multi-section pages with:
 * - Multiple components stacked vertically
 * - Gaze tracking across entire page
 * - Section-specific optimization
 * - Iterative building (add/edit/remove sections)
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { ComponentNode, GazePoint } from '@/types'

interface PageSection {
  id: string
  component: ComponentNode
  order: number
  gazeHeatmap?: GazePoint[]
}

interface PageBuilderCanvasProps {
  sections: PageSection[]
  onSectionClick?: (sectionId: string) => void
  onSectionRemove?: (sectionId: string) => void
  onSectionReorder?: (sectionId: string, newOrder: number) => void
  currentGaze?: GazePoint | null
}

export function PageBuilderCanvas({
  sections,
  onSectionClick,
  onSectionRemove,
  onSectionReorder,
  currentGaze
}: PageBuilderCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [hoveredSection, setHoveredSection] = useState<string | null>(null)

  // Render each section's HTML
  const renderSection = (section: PageSection) => {
    try {
      // Safety checks
      if (!section || !section.component || !section.component.code) {
        return (
          <div key={section?.id || 'invalid'} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 font-semibold">Invalid section data</p>
            <p className="text-sm text-yellow-600">Missing component or code</p>
          </div>
        )
      }
      
      // Create a sandboxed iframe for each section
      const html = buildSectionHTML(section.component.code)
      
      return (
        <div
          key={section.id}
          className="relative border-2 border-transparent hover:border-blue-500 transition-all group"
          onMouseEnter={() => setHoveredSection(section.id)}
          onMouseLeave={() => setHoveredSection(null)}
          onClick={() => onSectionClick?.(section.id)}
        >
          {/* Section Controls (show on hover) */}
          {hoveredSection === section.id && (
            <div className="absolute top-2 right-2 z-10 flex gap-2 bg-slate-900 rounded-lg p-2 shadow-lg">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSectionReorder?.(section.id, section.order - 1)
                }}
                className="p-1 hover:bg-slate-700 rounded text-white text-sm"
                title="Move up"
              >
                ↑
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSectionReorder?.(section.id, section.order + 1)
                }}
                className="p-1 hover:bg-slate-700 rounded text-white text-sm"
                title="Move down"
              >
                ↓
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSectionRemove?.(section.id)
                }}
                className="p-1 hover:bg-red-700 rounded text-white text-sm"
                title="Remove"
              >
                🗑️
              </button>
            </div>
          )}

          {/* Section Content */}
          <iframe
            srcDoc={html}
            className="w-full border-0"
            style={{ minHeight: '400px', height: 'auto' }}
            sandbox="allow-scripts allow-same-origin"
            title={`Section ${section.component.name}`}
            onLoad={() => console.log(`✅ Section ${section.component.name} loaded`)}
            onError={(e) => console.error(`❌ Section ${section.component.name} error:`, e)}
          />

          {/* Section Label */}
          <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-xs px-2 py-1 rounded">
            {section.component.name}
          </div>
        </div>
      )
    } catch (error) {
      return (
        <div key={section.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-semibold">Error rendering section: {section.component.name}</p>
          <p className="text-sm text-red-600">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      )
    }
  }

  return (
    <div
      ref={canvasRef}
      className="w-full h-full bg-gray-50 overflow-auto relative"
    >
      {/* Gaze Cursor Overlay - BIGGER and SMOOTHER just like main page */}
      {currentGaze && (() => {
        // Constrain gaze to canvas area (keep out of sidebar chat)
        // The sidebar is w-96 = 384px on the right
        const constrainedX = Math.min(currentGaze.x, window.innerWidth - 400)
        const constrainedY = currentGaze.y
        
        return <>
          {/* Outer pulse ring - BIGGER */}
          <div
            className="fixed rounded-full pointer-events-none z-50"
            style={{
              left: constrainedX,
              top: constrainedY,
              width: 50,
              height: 50,
              border: `3px solid ${currentGaze.trackingQuality === 'excellent' ? '#10b981' : currentGaze.trackingQuality === 'good' ? '#3b82f6' : currentGaze.trackingQuality === 'fair' ? '#f59e0b' : '#ef4444'}`,
              animation: 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              transform: 'translate(-50%, -50%)',
            }}
          />
          
          {/* Main gaze dot - MUCH BIGGER for better visibility */}
          <div
            className="fixed rounded-full pointer-events-none z-50"
            style={{
              left: constrainedX,
              top: constrainedY,
              width: 32,
              height: 32,
              border: `4px solid ${currentGaze.trackingQuality === 'excellent' ? '#10b981' : currentGaze.trackingQuality === 'good' ? '#3b82f6' : currentGaze.trackingQuality === 'fair' ? '#f59e0b' : '#ef4444'}`,
              background: currentGaze.trackingQuality === 'excellent' ? 'rgba(16, 185, 129, 0.4)' : currentGaze.trackingQuality === 'poor' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 211, 238, 0.4)',
              boxShadow: currentGaze.trackingQuality === 'excellent' ? '0 0 30px rgba(16, 185, 129, 0.7)' : currentGaze.trackingQuality === 'good' ? '0 0 25px rgba(59, 130, 246, 0.6)' : '0 0 15px rgba(34, 211, 238, 0.4)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'translate(-50%, -50%)',
            }}
          />
          
          {/* Inner highlight dot */}
          <div
            className="fixed rounded-full pointer-events-none z-50"
            style={{
              left: constrainedX,
              top: constrainedY,
              width: 12,
              height: 12,
              background: currentGaze.trackingQuality === 'excellent' ? '#10b981' : currentGaze.trackingQuality === 'good' ? '#3b82f6' : currentGaze.trackingQuality === 'fair' ? '#f59e0b' : '#ef4444',
              animation: 'quality-pulse 1.5s ease-in-out infinite',
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)',
            }}
          />
        </>
      }
      )()}

      {/* Page Sections */}
      <div className="max-w-7xl mx-auto">
        {!sections || sections.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">Empty Canvas</h3>
              <p className="text-gray-500">Generate your first section to get started</p>
            </div>
          </div>
        ) : (
          sections
            .sort((a, b) => a.order - b.order)
            .map(section => renderSection(section))
        )}
      </div>

      {/* Page Stats */}
      {sections && sections.length > 0 && (
        <div className="fixed bottom-4 left-4 bg-slate-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          📄 {sections.length} section{sections.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

/**
 * Build HTML for a single section
 */
function buildSectionHTML(componentCode: string): string {
  // Clean up code - remove imports but keep function declarations
  const cleanedCode = componentCode
    .replace(/^import\s+.*from.*$/gm, '') // Remove all import statements
    .replace(/^export\s+default\s+/gm, '') // Remove "export default "
    .replace(/^export\s+(?=function|const)/gm, '') // Remove "export " before function/const
    .trim()

  // Extract component name - multiple patterns to catch different formats
  let componentName = 'Component'
  
  // Try: export function ComponentName()
  let nameMatch = componentCode.match(/export\s+function\s+(\w+)/)
  if (nameMatch) {
    componentName = nameMatch[1]
  } else {
    // Try: export const ComponentName =
    nameMatch = componentCode.match(/export\s+const\s+(\w+)/)
    if (nameMatch) {
      componentName = nameMatch[1]
    } else {
      // Try: function ComponentName()
      nameMatch = componentCode.match(/function\s+(\w+)/)
      if (nameMatch) {
        componentName = nameMatch[1]
      } else {
        // Try: const ComponentName =
        nameMatch = componentCode.match(/const\s+(\w+)/)
        if (nameMatch) {
          componentName = nameMatch[1]
        }
      }
    }
  }

  console.log('🔨 Building HTML for:', componentName)
  console.log('📝 Code length:', componentCode.length, 'chars')
  console.log('📄 First 200 chars:', componentCode.substring(0, 200))

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${componentName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            primary: '#3b82f6',
            secondary: '#8b5cf6',
          }
        }
      }
    }
  </script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { 
      margin: 0; 
      padding: 0; 
      font-family: system-ui, -apple-system, sans-serif; 
      background: white;
    }
    #root {
      min-height: 100vh;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react,typescript">
    // React hooks available as React.useState, React.useEffect, etc.
    // Components should use this format directly

    // Error Boundary
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
      }
      static getDerivedStateFromError(error) {
        return { hasError: true, error };
      }
      componentDidCatch(error, errorInfo) {
        console.error('❌ Component error:', error, errorInfo);
      }
      render() {
        if (this.state.hasError) {
          return (
            <div style={{
              padding: '20px',
              background: '#fee2e2',
              color: '#991b1b',
              borderRadius: '8px',
              margin: '20px',
              fontFamily: 'sans-serif'
            }}>
              <h2 style={{ margin: '0 0 10px 0' }}>⚠️ Section Error</h2>
              <p>{this.state.error?.message || 'Unknown error'}</p>
              <details style={{ marginTop: '10px', fontSize: '12px' }}>
                <summary>Stack Trace</summary>
                <pre style={{ marginTop: '5px', overflow: 'auto' }}>{this.state.error?.stack}</pre>
              </details>
            </div>
          );
        }
        return this.props.children;
      }
    }
    
    // Component code
    ${cleanedCode}
    
    // Render
    try {
      console.log('🚀 Rendering: ${componentName}');
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(
        <React.StrictMode>
          <ErrorBoundary>
            <${componentName} />
          </ErrorBoundary>
        </React.StrictMode>
      );
      console.log('✅ ${componentName} rendered successfully');
    } catch (error) {
      console.error('❌ Render error:', error);
      document.getElementById('root').innerHTML = \`
        <div style="padding: 20px; background: #fee2e2; color: #991b1b; border-radius: 8px; margin: 20px;">
          <h2>⚠️ Failed to Render</h2>
          <p><strong>Error:</strong> \${error.message}</p>
          <p style="margin-top: 10px; font-size: 12px;">Check console for details (F12)</p>
        </div>
      \`;
    }
  </script>
</body>
</html>`
}

