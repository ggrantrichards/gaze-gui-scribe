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
import { useComponentDwellDetection } from '@/hooks/useComponentDwellDetection'
import { GazeSuggestionPanel } from './GazeSuggestionPanel'

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
  onSectionUpdate?: (sectionId: string, newCode: string) => void
  currentGaze?: GazePoint | null
}

export function PageBuilderCanvas({
  sections,
  onSectionClick,
  onSectionRemove,
  onSectionReorder,
  onSectionUpdate,
  currentGaze
}: PageBuilderCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [hoveredSection, setHoveredSection] = useState<string | null>(null)
  
  // CORE FEATURE: Gaze-driven suggestion system
  const { activeDwell, dismissDwell } = useComponentDwellDetection(
    currentGaze,
    canvasRef,
    {
      dwellThreshold: 2000, // 2 seconds
      proximityThreshold: 50,
      gazeTimeout: 500
    }
  )
  
  // Track which section the active dwell belongs to
  const [activeDwellSection, setActiveDwellSection] = useState<string | null>(null)
  
  // Detect which section contains the dwelled element
  useEffect(() => {
    if (!activeDwell) {
      setActiveDwellSection(null)
      return
    }
    
    // Find which section this element belongs to
    // Check if element is inside an iframe
    const element = activeDwell.element as any
    const parentIframe = element._parentIframe as HTMLIFrameElement | undefined
    
    if (parentIframe) {
      // Find which section owns this iframe
      for (const section of sections) {
        const sectionDiv = document.querySelector(`[data-section-id="${section.id}"]`)
        if (sectionDiv && sectionDiv.contains(parentIframe)) {
          setActiveDwellSection(section.id)
          console.log('🎯 Dwell detected in section:', section.id)
          return
        }
      }
    }
  }, [activeDwell, sections])
  
  // CORE FEATURE: Apply suggestion to section
  const handleApplySuggestion = async (suggestion: any) => {
    if (!activeDwellSection || !activeDwell) return
    
    const section = sections.find(s => s.id === activeDwellSection)
    if (!section) return
    
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
    
    try {
      console.log('🔄 Applying suggestion:', suggestion.title)
      
      const response = await fetch(`${BACKEND_URL}/api/apply-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: activeDwellSection,
          originalCode: section.component.code,
          elementSelector: activeDwell.elementId,
          suggestion: suggestion
        })
      })
      
      if (!response.ok) throw new Error('Failed to apply edit')
      
      const data = await response.json()
      console.log('✅ Suggestion applied successfully')
      
      // Update section with new code
      onSectionUpdate?.(activeDwellSection, data.modifiedCode)
      
      // Dismiss suggestion panel
      dismissDwell()
    } catch (error) {
      console.error('Error applying suggestion:', error)
    }
  }
  
  // CORE FEATURE: Apply custom edit to section
  const handleCustomEdit = async (customText: string) => {
    if (!activeDwellSection || !activeDwell) return
    
    const section = sections.find(s => s.id === activeDwellSection)
    if (!section) return
    
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
    
    try {
      console.log('🔄 Applying custom edit:', customText)
      
      const response = await fetch(`${BACKEND_URL}/api/apply-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: activeDwellSection,
          originalCode: section.component.code,
          elementSelector: activeDwell.elementId,
          suggestion: {},
          customEdit: customText
        })
      })
      
      if (!response.ok) throw new Error('Failed to apply custom edit')
      
      const data = await response.json()
      console.log('✅ Custom edit applied successfully')
      
      // Update section with new code
      onSectionUpdate?.(activeDwellSection, data.modifiedCode)
      
      // Dismiss suggestion panel
      dismissDwell()
    } catch (error) {
      console.error('Error applying custom edit:', error)
    }
  }

  // Render each section's HTML
  const renderSection = (section: PageSection) => {
    try {
      // Create a sandboxed iframe for each section
      // Use section.id as key to ensure proper rendering
      const html = buildSectionHTML(section.component.code)
      
      return (
        <div
          key={section.id}
          data-section-id={section.id}
          className="relative bg-white rounded-2xl overflow-visible shadow-lg hover:shadow-2xl transition-all duration-300 mb-6 group border-2 border-slate-200 hover:border-blue-400"
          onMouseEnter={() => setHoveredSection(section.id)}
          onMouseLeave={() => setHoveredSection(null)}
          onClick={(e) => {
            // COMPLETELY DISABLE section click when clicking inside iframe content
            // This prevents ANY button/link clicks inside iframe from triggering section actions
            const target = e.target as HTMLElement
            
            // Check if click is inside iframe or on iframe itself
            if (target.tagName === 'IFRAME') {
              e.stopPropagation()
              return // Don't trigger section click
            }
            
            // Check if click is on a child of the section container (like controls)
            // but not the container itself
            if (target !== e.currentTarget) {
              // Allow clicks on control buttons, but not on the section content
              return
            }
            
            // Only trigger if clicking directly on the section container background
            onSectionClick?.(section.id)
          }}
        >
          {/* Section Controls Bar - Positioned ABOVE section, not overlaying content */}
          <div className="absolute -top-12 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-t-xl shadow-lg z-30 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                  {section.order + 1}
                </div>
                <div>
                  <div className="font-semibold text-sm">{section.component.name}</div>
                  <div className="text-xs text-blue-100">Click to edit section</div>
                </div>
              </div>
              
              {/* Section Controls - Clean Icons */}
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onSectionReorder?.(section.id, section.order - 1)
                  }}
                  className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors"
                  title="Move up"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onSectionReorder?.(section.id, section.order + 1)
                  }}
                  className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors"
                  title="Move down"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onSectionRemove?.(section.id)
                  }}
                  className="w-7 h-7 flex items-center justify-center hover:bg-red-400 rounded-lg transition-colors"
                  title="Remove section"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Section Number Badge - Always Visible in bottom-left corner */}
          <div className="absolute bottom-4 left-4 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg z-10 transition-all duration-200 group-hover:scale-110">
            {section.order + 1}
          </div>

          {/* Section Content - Accurate sizing */}
          <div className="relative" onClick={(e) => {
            // Prevent clicks inside iframe from propagating to section container
            e.stopPropagation()
          }}>
            <iframe
              ref={(iframe) => {
                if (iframe && !iframe.dataset.resized) {
                  // Set up auto-resize with postMessage for accurate heights
                  iframe.dataset.resized = 'true'
                  
                  // Listen for messages from iframes (resize + diagnostics)
                  window.addEventListener('message', (event) => {
                    const data = event.data
                    if (!data || typeof data !== 'object') return

                    // Height updates
                    if (data.type === 'RESIZE_IFRAME' && data.height) {
                      const iframes = document.querySelectorAll('iframe')
                      iframes.forEach(f => {
                        if (f.contentWindow === event.source) {
                          f.style.height = `${data.height}px`
                        }
                      })
                      return
                    }

                    // Console forwarding from iframe
                    if (data.type === 'IFRAME_CONSOLE') {
                      const args = Array.isArray(data.args) ? data.args : [data.args]
                      const prefix = `[Section:${data.section || 'unknown'}]`
                      if (data.level === 'warn') console.warn(prefix, ...args)
                      else if (data.level === 'error') console.error(prefix, ...args)
                      else console.log(prefix, ...args)
                      return
                    }

                    // Error forwarding from iframe
                    if (data.type === 'IFRAME_ERROR') {
                      const prefix = `[Section:${data.section || 'unknown'}]`
                      console.error(prefix, data.message || 'Iframe error', {
                        source: data.source,
                        line: data.lineno,
                        column: data.colno,
                        stack: data.stack
                      })
                    }
                  })
                }
              }}
              srcDoc={html}
              className="w-full border-0 bg-white"
              style={{ 
                height: '200px', // Start with small default
                display: 'block',
                overflow: 'hidden',
                transition: 'height 0.3s ease',
                pointerEvents: 'auto' // Ensure iframe is interactive
              }}
              sandbox="allow-scripts allow-same-origin"
              title={`Section ${section.component.name}`}
              onLoad={(e) => {
                const iframe = e.target as HTMLIFrameElement
                console.log(`✅ Section ${section.component.name} loaded`)
                
                // More reliable auto-resize using multiple methods
                setTimeout(() => {
                  try {
                    if (iframe.contentWindow?.document?.body) {
                      const body = iframe.contentWindow.document.body
                      const root = iframe.contentWindow.document.getElementById('root')
                      
                      // Get actual content height using multiple methods
                      const scrollHeight = body.scrollHeight
                      const offsetHeight = body.offsetHeight
                      const rootHeight = root?.offsetHeight || 0
                      
                      // Use the maximum of all measurements
                      const contentHeight = Math.max(scrollHeight, offsetHeight, rootHeight)
                      
                      console.log(`📏 Section "${section.component.name}" heights:`, {
                        scrollHeight,
                        offsetHeight,
                        rootHeight,
                        final: contentHeight
                      })
                      
                      if (contentHeight > 50) {
                        // Add padding for safety
                        iframe.style.height = `${contentHeight + 20}px`
                      } else {
                        // Fallback for sections that haven't rendered yet
                        iframe.style.height = '400px'
                      }
                    }
                  } catch (err) {
                    console.warn('Could not auto-resize iframe:', err)
                    iframe.style.height = '400px' // Safe fallback
                  }
                }, 500) // Give React time to render
                
                // Second attempt after more time for complex sections
                setTimeout(() => {
                  try {
                    if (iframe.contentWindow?.document?.body) {
                      const contentHeight = iframe.contentWindow.document.body.scrollHeight
                      if (contentHeight > 50) {
                        iframe.style.height = `${contentHeight + 20}px`
                      }
                    }
                  } catch (err) {
                    // Silent fail on second attempt
                  }
                }, 1500)
              }}
              onError={(e) => console.error(`❌ Section ${section.component.name} error:`, e)}
            />
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
      className="w-full h-full overflow-y-auto overflow-x-hidden bg-gradient-to-br from-slate-50 to-slate-100 relative"
      style={{ 
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* Gaze Cursor Overlay - Fixed to viewport */}
      {currentGaze && (
        <div
          className="fixed w-4 h-4 bg-blue-500 rounded-full pointer-events-none z-[9999] opacity-60 shadow-lg"
          style={{
            left: currentGaze.x - 8,
            top: currentGaze.y - 8,
            transform: 'translate(0, 0)',
            border: '2px solid white',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
          }}
        />
      )}

      {/* Full-Screen Page Sections */}
      <div className="w-full min-h-screen pb-20">
        {sections.length === 0 ? (
          <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="text-center p-12 max-w-2xl">
              <div className="text-8xl mb-8 animate-bounce">🎨</div>
              <h3 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Your Canvas Awaits
              </h3>
              <p className="text-slate-600 text-xl mb-8">
                Generate beautiful, responsive sections powered by AI
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <span className="px-6 py-3 bg-blue-100 text-blue-700 rounded-full font-semibold text-sm shadow-sm">
                  📱 Fully Responsive
                </span>
                <span className="px-6 py-3 bg-purple-100 text-purple-700 rounded-full font-semibold text-sm shadow-sm">
                  ⚡ Lightning Fast
                </span>
                <span className="px-6 py-3 bg-green-100 text-green-700 rounded-full font-semibold text-sm shadow-sm">
                  🎯 Gaze Tracking
                </span>
                <span className="px-6 py-3 bg-orange-100 text-orange-700 rounded-full font-semibold text-sm shadow-sm">
                  🤖 AI-Powered
                </span>
              </div>
              <div className="mt-12 text-sm text-slate-500">
                <p>💡 Tip: Try "Create a landing page for a SaaS product"</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-[1400px] mx-auto px-4 py-6 pt-16">
            {/* Extra top padding to prevent controls from being cut off */}
            {/* Force unique keys to prevent React from reusing components incorrectly */}
            {sections
              .sort((a, b) => a.order - b.order)
              .map(section => (
                <div key={`section-wrapper-${section.id}`}>
                  {renderSection(section)}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Page Stats - Floating Bottom Right */}
      {sections.length > 0 && (
        <div className="fixed bottom-8 right-8 bg-white/95 backdrop-blur-md text-slate-800 px-6 py-4 rounded-2xl shadow-2xl border border-slate-200 flex items-center gap-4 z-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
              📄
            </div>
            <div>
              <div className="font-bold text-lg">{sections.length}</div>
              <div className="text-xs text-slate-500">Section{sections.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* CORE FEATURE: Gaze Suggestion Panel */}
      {activeDwell && activeDwellSection && (
        <GazeSuggestionPanel
          elementType={activeDwell.elementType}
          elementText={activeDwell.elementText}
          elementProperties={activeDwell.elementProperties}
          dwellTime={activeDwell.dwellTime}
          boundingRect={activeDwell.boundingRect}
          sectionId={activeDwellSection}
          onApplySuggestion={handleApplySuggestion}
          onCustomEdit={handleCustomEdit}
          onDismiss={dismissDwell}
        />
      )}
    </div>
  )
}

/**
 * Build HTML for a single section
 */
function buildSectionHTML(componentCode: string): string {
  // Clean up code - remove imports but keep function declarations
  let cleanedCode = componentCode
    // Remove markdown code blocks if present
    .replace(/^```[\w]*\n/gm, '') // Remove opening code block
    .replace(/```$/gm, '') // Remove closing code block
    // Remove all import statements (including TypeScript imports)
    .replace(/^import\s+.*from\s+['"].*['"];?$/gm, '')
    .replace(/^import\s+type\s+.*from\s+['"].*['"];?$/gm, '')
    // Remove export default
    .replace(/^export\s+default\s+/gm, '')
    // Remove export keyword before function/const/class
    .replace(/^export\s+(?=function|const|class)/gm, '')
    // Remove TypeScript interface/type declarations (entire lines)
    .replace(/^\s*(interface|type)\s+\w+.*$/gm, '')
    // Remove simple type annotations (be conservative)
    .replace(/:\s*(string|number|boolean|any|void|null|undefined)(\s*[=,;\)\]\}])/g, '$2')
    // Ensure React hooks use React. prefix (if not already)
    .replace(/\buseState\(/g, 'React.useState(')
    .replace(/\buseRef\(/g, 'React.useRef(')
    .replace(/\buseEffect\(/g, 'React.useEffect(')
    .replace(/\buseCallback\(/g, 'React.useCallback(')
    .replace(/\buseMemo\(/g, 'React.useMemo(')
    // Remove duplicate React. prefixes (in case code already had React.useState)
    .replace(/React\.React\./g, 'React.')
    .trim()
  
  // Remove any remaining empty lines at the start
  cleanedCode = cleanedCode.replace(/^\s*\n+/gm, '')
  // IMPORTANT: Do NOT escape template literals or ${} in generated code now that we
  // deliver it via Base64 and compile with Babel. Escaping would corrupt valid TSX.

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

  // Base64-encode the code in a browser-safe way (handles Unicode)
  const codeB64 = ((): string => {
    try {
      const utf8 = encodeURIComponent(cleanedCode).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16)))
      // @ts-ignore
      return (typeof btoa === 'function' ? btoa(utf8) : '')
    } catch {
      return ''
    }
  })()

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
  <script>
    // Preload and compile the generated component code using Babel, then eval
    (function(){
      try {
        // Prevent Babel from scanning <script type="text/babel"> tags automatically
        try { if (window.Babel && typeof window.Babel.disableScriptTags === 'function') { window.Babel.disableScriptTags(); } } catch(_) {}
        var CODE_B64 = '${codeB64}';
        function b64ToUtf8(b64){
          try {
            var bin = atob(b64);
            var esc = '';
            for (var i=0;i<bin.length;i++) {
              var h = bin.charCodeAt(i).toString(16).padStart(2,'0');
              esc += '%' + h;
            }
            return decodeURIComponent(esc);
          } catch (e) { return ''; }
        }
        var code = b64ToUtf8(CODE_B64);
        if (code) {
          var result = Babel.transform(code, { presets: ['react','typescript'], filename: 'component.tsx' });
          // Eval the compiled code
          try { 
            (0, eval)(result.code);
            // After eval, try to find and expose the component
            var compName = '${componentName}';
            if (typeof window[compName] === 'undefined' && typeof eval('typeof ' + compName) !== 'undefined') {
              try {
                window[compName] = eval(compName);
                console.log('Exposed component:', compName);
              } catch(e) {
                console.warn('Could not expose component:', compName, e);
              }
            }
            // Also check if it's already on window
            if (typeof window[compName] !== 'undefined') {
              console.log('Component found on window:', compName);
            } else {
              console.warn('Component not found after compilation:', compName, 'Available:', Object.keys(window).filter(function(k) { return /^[A-Z]/.test(k); }).slice(0, 10));
            }
          } catch (e) {
            console.error('Component eval error:', e);
            window.parent && window.parent.postMessage({ type: 'IFRAME_ERROR', section: '${componentName}', message: e && (e.message || String(e)), stack: e && e.stack }, '*');
          }
        } else {
          console.error('Failed to decode code from Base64');
        }
      } catch (e) {
        console.error('Precompile error:', e);
        try { window.parent.postMessage({ type: 'IFRAME_ERROR', section: '${componentName}', message: e && (e.message || String(e)), stack: e && e.stack }, '*'); } catch(_) {}
      }
    })();
  </script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body { 
      margin: 0; 
      padding: 0; 
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
      background: white;
      overflow: hidden; /* Prevent scrolling within iframe */
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      width: 100%;
    }
    body {
      width: 100%;
      min-height: fit-content;
    }
    #root {
      width: 100%;
      min-height: fit-content;
      background: white;
    }
    /* Ensure components take natural height */
    #root > * {
      width: 100%;
      min-height: fit-content;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    // Diagnostics: forward console and errors to parent window
    (function(){
      const SECTION_NAME = '${componentName}';
      function post(type, payload){
        try { window.parent.postMessage(Object.assign({ type, section: SECTION_NAME }, payload || {}), '*'); } catch (_) {}
      }
      ['log','warn','error'].forEach(function(level){
        var orig = console[level];
        console[level] = function(){
          try { post('IFRAME_CONSOLE', { level: level, args: Array.prototype.slice.call(arguments).map(function(a){ try { return typeof a === 'string' ? a : JSON.stringify(a); } catch(_) { return String(a); } }) }); } catch(_) {}
          try { return orig.apply(console, arguments); } catch(_) {}
        };
      });
      window.onerror = function(message, source, lineno, colno, error){
        post('IFRAME_ERROR', { message: String(message), source: source, lineno: lineno, colno: colno, stack: error && error.stack });
      };
      window.addEventListener('unhandledrejection', function(e){
        var reason = e && e.reason ? e.reason : null;
        post('IFRAME_ERROR', { message: reason && reason.message ? reason.message : 'Unhandled promise rejection', stack: reason && reason.stack ? reason.stack : null });
      });
    })();
  </script>
  <script type="text/javascript">
    // Error Boundary class component (no JSX)
    function ErrorBoundaryClass() {}
    ErrorBoundaryClass.prototype = Object.create(React.Component.prototype);
    ErrorBoundaryClass.prototype.constructor = ErrorBoundaryClass;
    ErrorBoundaryClass.prototype.getInitialState = function() {
      return { hasError: false, error: null };
    };
    ErrorBoundaryClass.prototype.getDerivedStateFromError = function(error) {
      return { hasError: true, error: error };
    };
    ErrorBoundaryClass.prototype.componentDidCatch = function(error, errorInfo) {
      console.error('Component error:', error, errorInfo);
      try {
        window.parent.postMessage({
          type: 'IFRAME_ERROR',
          section: '${componentName}',
          message: error && (error.message || String(error)),
          stack: error && error.stack
        }, '*');
      } catch (_) {}
    };
    ErrorBoundaryClass.prototype.render = function() {
      if (this.state && this.state.hasError) {
        return React.createElement('div', {
          style: {
            padding: '20px',
            background: 'rgb(254, 226, 226)',
            color: 'rgb(153, 27, 27)',
            borderRadius: '8px',
            margin: '20px',
            fontFamily: 'sans-serif'
          }
        }, [
          React.createElement('h2', { key: 'h2', style: { margin: '0 0 10px 0' } }, 'Section Error'),
          React.createElement('p', { key: 'p' }, this.state.error && (this.state.error.message || 'Unknown error')),
          React.createElement('details', { key: 'details', style: { marginTop: '10px', fontSize: '12px' } }, [
            React.createElement('summary', { key: 'summary' }, 'Stack Trace'),
            React.createElement('pre', { key: 'pre', style: { marginTop: '5px', overflow: 'auto' } }, this.state.error && this.state.error.stack)
          ])
        ]);
      }
      return this.props.children;
    };
    var ErrorBoundary = ErrorBoundaryClass;

    // Render (no JSX here to avoid Babel parsing)
    try {
      console.log('Rendering:', '${componentName}');
      var RootComp = (window && window['${componentName}']) || (typeof ${componentName} !== 'undefined' ? ${componentName} : null);
      if (!RootComp) { 
        throw new Error('Component ${componentName} not found after compilation. Available globals: ' + Object.keys(window).filter(k => /^[A-Z]/.test(k)).join(', '));
      }
      var root = ReactDOM.createRoot(document.getElementById('root'));
      var tree = React.createElement(
        React.StrictMode,
        null,
        React.createElement(
          ErrorBoundary,
          null,
          React.createElement(RootComp, null)
        )
      );
      root.render(tree);
      console.log('Component rendered successfully:', '${componentName}');
      
      // Send height to parent for accurate sizing
      setTimeout(() => {
        const height = Math.max(
          document.body.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.scrollHeight,
          document.documentElement.offsetHeight,
          document.getElementById('root')?.offsetHeight || 0
        );
        console.log('Sending height to parent:', height);
        window.parent.postMessage({
          type: 'RESIZE_IFRAME',
          height: height + 20
        }, '*');
      }, 300);
      
      // Send again after content settles
      setTimeout(() => {
        const height = Math.max(
          document.body.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.scrollHeight,
          document.documentElement.offsetHeight,
          document.getElementById('root')?.offsetHeight || 0
        );
        window.parent.postMessage({
          type: 'RESIZE_IFRAME',
          height: height + 20
        }, '*');
      }, 1000);
    } catch (error) {
      console.error('Render error:', error);
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.innerHTML = '';
        
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'padding: 20px; background: rgb(254, 226, 226); color: rgb(153, 27, 27); border-radius: 8px; margin: 20px; font-family: sans-serif;';
        
        const h2 = document.createElement('h2');
        h2.style.cssText = 'margin: 0 0 10px 0;';
        h2.textContent = 'Failed to Render';
        errorDiv.appendChild(h2);
        
        const p1 = document.createElement('p');
        p1.style.cssText = 'margin: 0 0 10px 0;';
        const strong = document.createElement('strong');
        strong.textContent = 'Error: ';
        p1.appendChild(strong);
        const errorText = document.createTextNode(error && error.message ? error.message : 'Unknown error');
        p1.appendChild(errorText);
        errorDiv.appendChild(p1);
        
        const p2 = document.createElement('p');
        p2.style.cssText = 'margin-top: 10px; font-size: 12px;';
        p2.textContent = 'Check console for details (F12)';
        errorDiv.appendChild(p2);
        
        rootEl.appendChild(errorDiv);
      }
    }
  </script>
</body>
</html>`
}

