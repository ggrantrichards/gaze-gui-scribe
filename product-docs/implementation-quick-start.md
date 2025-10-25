# Implementation Quick Start Guide
## Getting Started with Agentic Builder Development

**For:** Development Team  
**Updated:** October 25, 2025

---

## Week 1-2: Project Setup & Dependencies

### Step 1: Install Core Dependencies

```bash
# AI/ML dependencies
npm install openai @anthropic-ai/sdk langchain @langchain/core

# Code editing & preview
npm install @codesandbox/sandpack-react @codesandbox/sandpack-client
npm install @monaco-editor/react

# State management
npm install zustand immer

# Collaboration
npm install yjs y-websocket

# Code generation
npm install @babel/core @babel/parser @babel/traverse @babel/generator
npm install prettier eslint

# Analytics & visualization
npm install d3 recharts

# Utilities
npm install zod clsx tailwind-merge
npm install dexie # IndexedDB wrapper

# Dev dependencies
npm install -D @types/node
```

### Step 2: Environment Variables Setup

Create `.env.local`:

```bash
# AI Providers (use at least one)
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...

# Optional: Local LLM (Ollama)
VITE_USE_LOCAL_LLM=false
VITE_LOCAL_LLM_URL=http://localhost:11434

# GitHub Integration (optional for MVP)
VITE_GITHUB_CLIENT_ID=...
VITE_GITHUB_CLIENT_SECRET=...

# Deployment (optional for MVP)
VITE_VERCEL_TOKEN=...

# WebSocket Server (for collaboration)
VITE_WS_SERVER_URL=ws://localhost:3001

# Feature Flags
VITE_ENABLE_VOICE_INPUT=true
VITE_ENABLE_COLLABORATION=false # Phase 6
VITE_ENABLE_GAZE_ANALYTICS=true
```

### Step 3: Update `tsconfig.json`

Add path aliases for cleaner imports:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/services/*": ["./src/services/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/store/*": ["./src/store/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/types": ["./src/types.ts"]
    }
  }
}
```

---

## Week 2: Create Base File Structure

### Step 1: Create Service Directories

```bash
mkdir -p src/services/{ai,analytics,codegen,export,integrations,collaboration,voice,nlp}
mkdir -p src/services/codegen/templates
mkdir -p src/services/export/generators
mkdir -p src/components/builder
mkdir -p src/store
mkdir -p src/design-system/{components,utils}
```

### Step 2: Create Base Types

Update `src/types.ts`:

```typescript
// Existing types
export interface GazePoint {
  x: number
  y: number
  timestamp: number
  confidence?: number
}

export interface ElementLock {
  id: string
  role: string
  bbox: { x: number; y: number; w: number; h: number }
  element: HTMLElement
  originalStyles: Record<string, string>
}

// NEW TYPES FOR AGENTIC BUILDER

// Component Tree
export interface ComponentNode {
  id: string
  type: string
  name: string
  code: string
  props: Record<string, any>
  children: ComponentNode[]
  gazeMetrics?: GazeMetrics
  createdAt: number
  updatedAt: number
}

export interface ComponentTree {
  root: ComponentNode
  selectedNode: string | null
  history: ComponentNode[]
  currentVersion: number
}

// Gaze Analytics
export interface GazeMetrics {
  averageDwellTime: number
  firstFixationTime: number
  revisitCount: number
  skipRate: number
  attentionScore: number  // 0-100
  heatmapData?: HeatmapPoint[]
}

export interface HeatmapPoint {
  x: number
  y: number
  intensity: number  // 0-1
}

export interface GazeAnalytics {
  topAttentionAreas: string[]
  avgDwellTime: number
  totalFixations: number
  scanpathComplexity: number
}

// AI Agent
export interface LLMRequest {
  prompt: string
  gazeContext?: GazeAnalytics
  componentContext?: ComponentTree
  designSystem: DesignTokens
  options?: GeneratorOptions
}

export interface LLMResponse {
  code: string
  explanation: string
  dependencies: string[]
  gazeOptimizations?: string[]
  componentType: string
}

export interface AgentTool {
  name: string
  description: string
  parameters: Record<string, any>
  execute: (params: any) => Promise<any>
}

// Code Generation
export interface GeneratorOptions {
  framework: 'react' | 'vue' | 'svelte'
  styling: 'tailwind' | 'css' | 'styled-components'
  typescript: boolean
  accessibility: boolean
}

export interface GeneratedComponent {
  code: string
  files: Record<string, string>
  dependencies: Record<string, string>
  tests?: string
}

// Design System
export interface DesignTokens {
  colors: {
    primary: ColorScale
    secondary: ColorScale
    neutral: ColorScale
    semantic: SemanticColors
  }
  typography: Typography
  spacing: Record<string, string>
  borderRadius: Record<string, string>
  shadows: Record<string, string>
  breakpoints: Record<string, string>
}

export interface ColorScale {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
  950: string
}

export interface SemanticColors {
  success: string
  warning: string
  error: string
  info: string
}

export interface Typography {
  fontFamily: {
    sans: string
    serif: string
    mono: string
  }
  fontSize: Record<string, string>
  fontWeight: Record<string, number>
  lineHeight: Record<string, number>
}

// Export & Deployment
export interface ExportOptions {
  format: 'react' | 'vue' | 'svelte' | 'html'
  typescript: boolean
  styling: 'tailwind' | 'css-modules' | 'styled-components'
  includeTests: boolean
  packageManager: 'npm' | 'yarn' | 'pnpm'
}

export interface ExportedProject {
  name: string
  files: Record<string, string>
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  readme: string
}

export interface DeploymentResult {
  url: string
  status: 'building' | 'ready' | 'error'
  buildLogs?: string[]
  error?: string
}

// Collaboration
export interface CollaborationUser {
  id: string
  name: string
  color: string
  cursor: { x: number; y: number }
  gazePoint?: GazePoint
  currentSelection?: string
}

export interface Version {
  id: string
  timestamp: number
  author: string
  description: string
  componentTree: ComponentTree
  gazeData?: GazeDataSnapshot
}

export interface GazeDataSnapshot {
  points: GazePoint[]
  heatmaps: Record<string, HeatmapPoint[]>
  metrics: Record<string, GazeMetrics>
}

// NLP
export interface ParsedIntent {
  type: 'create' | 'modify' | 'delete' | 'analyze'
  target: 'component' | 'style' | 'layout' | 'behavior'
  action?: string
  params: {
    componentType?: string
    properties?: Record<string, any>
    constraints?: string[]
    elementId?: string
  }
  confidence: number
  gazeContext?: boolean
}

// Existing types (keep these)
export interface Intent {
  action: 'style.update' | 'text.replace'
  targetProps?: Record<string, string | number>
  newText?: string
}
```

---

## Week 3-4: Build AI Agent Core

### Priority 1: LLM Client

Create `src/services/ai/llm-client.ts`:

```typescript
import OpenAI from 'openai'
import type { LLMRequest, LLMResponse } from '@/types'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // TODO: Move to backend proxy
})

export class LLMClient {
  async generateComponent(request: LLMRequest): Promise<LLMResponse> {
    const systemPrompt = this.buildSystemPrompt(request)
    
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: request.prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: false // TODO: Add streaming support
      })

      const content = completion.choices[0].message.content || ''
      return this.parseResponse(content)
    } catch (error) {
      console.error('LLM generation failed:', error)
      throw new Error('Failed to generate component')
    }
  }

  private buildSystemPrompt(request: LLMRequest): string {
    let prompt = `You are an expert ${request.options?.framework || 'React'} developer.
    
Generate production-ready components with these requirements:
- Use TypeScript: ${request.options?.typescript ?? true}
- Styling: ${request.options?.styling || 'Tailwind CSS'}
- Accessibility: WCAG 2.1 AA compliant
- Responsive: Mobile-first design
- Clean code: Well-documented, typed, formatted

Design System:
${JSON.stringify(request.designSystem, null, 2)}
`

    if (request.gazeContext) {
      prompt += `\n
User Attention Insights:
- High attention areas: ${request.gazeContext.topAttentionAreas.join(', ')}
- Average dwell time: ${request.gazeContext.avgDwellTime}ms
- Optimize layout for these patterns
`
    }

    return prompt
  }

  private parseResponse(content: string): LLMResponse {
    // Extract code block
    const codeMatch = content.match(/```(?:tsx?|jsx?)?\n([\s\S]*?)```/)
    const code = codeMatch ? codeMatch[1] : content

    // Extract dependencies
    const importMatches = code.matchAll(/import .* from ['"](.+)['"]/g)
    const dependencies = Array.from(importMatches)
      .map(m => m[1])
      .filter(dep => !dep.startsWith('.') && !dep.startsWith('@/'))

    return {
      code,
      explanation: content.replace(/```[\s\S]*?```/g, '').trim(),
      dependencies: [...new Set(dependencies)],
      componentType: this.detectComponentType(code)
    }
  }

  private detectComponentType(code: string): string {
    if (/export (default )?function|export (default )?const/.test(code)) {
      const match = code.match(/(?:function|const) (\w+)/)
      return match ? match[1] : 'UnknownComponent'
    }
    return 'UnknownComponent'
  }
}

export const llmClient = new LLMClient()
```

### Priority 2: Zustand Store

Create `src/store/builder-store.ts`:

```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { ComponentTree, ComponentNode, GazeDataSnapshot } from '@/types'

interface BuilderState {
  // State
  componentTree: ComponentTree
  gazeData: GazeDataSnapshot | null
  currentCode: string
  isGenerating: boolean
  error: string | null
  
  // Actions
  addComponent: (parent: string | null, component: ComponentNode) => void
  updateComponent: (id: string, updates: Partial<ComponentNode>) => void
  deleteComponent: (id: string) => void
  selectComponent: (id: string | null) => void
  setCurrentCode: (code: string) => void
  setIsGenerating: (generating: boolean) => void
  setError: (error: string | null) => void
  
  // History
  undo: () => void
  redo: () => void
}

const initialTree: ComponentTree = {
  root: {
    id: 'root',
    type: 'div',
    name: 'Root',
    code: '<div></div>',
    props: {},
    children: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  selectedNode: null,
  history: [],
  currentVersion: 0
}

export const useBuilderStore = create<BuilderState>()(
  immer((set, get) => ({
    componentTree: initialTree,
    gazeData: null,
    currentCode: '',
    isGenerating: false,
    error: null,
    
    addComponent: (parentId, component) => set(state => {
      const parent = parentId 
        ? findNodeById(state.componentTree.root, parentId)
        : state.componentTree.root
        
      if (parent) {
        parent.children.push(component)
        state.componentTree.history.push({ ...state.componentTree.root })
        state.componentTree.currentVersion++
      }
    }),
    
    updateComponent: (id, updates) => set(state => {
      const node = findNodeById(state.componentTree.root, id)
      if (node) {
        Object.assign(node, { ...updates, updatedAt: Date.now() })
        state.componentTree.history.push({ ...state.componentTree.root })
        state.componentTree.currentVersion++
      }
    }),
    
    deleteComponent: (id) => set(state => {
      deleteNodeById(state.componentTree.root, id)
      state.componentTree.history.push({ ...state.componentTree.root })
      state.componentTree.currentVersion++
    }),
    
    selectComponent: (id) => set(state => {
      state.componentTree.selectedNode = id
    }),
    
    setCurrentCode: (code) => set({ currentCode: code }),
    setIsGenerating: (generating) => set({ isGenerating: generating }),
    setError: (error) => set({ error }),
    
    undo: () => set(state => {
      const { history, currentVersion } = state.componentTree
      if (currentVersion > 0) {
        state.componentTree.root = history[currentVersion - 1]
        state.componentTree.currentVersion--
      }
    }),
    
    redo: () => set(state => {
      const { history, currentVersion } = state.componentTree
      if (currentVersion < history.length - 1) {
        state.componentTree.root = history[currentVersion + 1]
        state.componentTree.currentVersion++
      }
    })
  }))
)

// Helper functions
function findNodeById(node: ComponentNode, id: string): ComponentNode | null {
  if (node.id === id) return node
  for (const child of node.children) {
    const found = findNodeById(child, id)
    if (found) return found
  }
  return null
}

function deleteNodeById(parent: ComponentNode, id: string): boolean {
  const index = parent.children.findIndex(c => c.id === id)
  if (index !== -1) {
    parent.children.splice(index, 1)
    return true
  }
  for (const child of parent.children) {
    if (deleteNodeById(child, id)) return true
  }
  return false
}
```

### Priority 3: Basic Component Generation Hook

Create `src/hooks/useCodeGeneration.ts`:

```typescript
import { useState, useCallback } from 'react'
import { useBuilderStore } from '@/store/builder-store'
import { llmClient } from '@/services/ai/llm-client'
import type { ComponentNode, GeneratorOptions } from '@/types'

export function useCodeGeneration() {
  const { addComponent, setIsGenerating, setError } = useBuilderStore()
  const [progress, setProgress] = useState<string>('')

  const generateComponent = useCallback(async (
    prompt: string,
    options?: GeneratorOptions
  ) => {
    setIsGenerating(true)
    setError(null)
    setProgress('Understanding your request...')

    try {
      // Step 1: Generate component via LLM
      setProgress('Generating component...')
      const response = await llmClient.generateComponent({
        prompt,
        designSystem: getDefaultDesignTokens(), // TODO: Get from theme context
        options
      })

      // Step 2: Validate generated code
      setProgress('Validating code...')
      const validation = await validateCode(response.code)
      if (!validation.valid) {
        throw new Error(`Invalid code: ${validation.errors.join(', ')}`)
      }

      // Step 3: Create component node
      const componentNode: ComponentNode = {
        id: `component-${Date.now()}`,
        type: response.componentType,
        name: response.componentType,
        code: response.code,
        props: {},
        children: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      // Step 4: Add to tree
      addComponent(null, componentNode)
      
      setProgress('Done!')
      return componentNode
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setError(message)
      throw error
    } finally {
      setIsGenerating(false)
      setTimeout(() => setProgress(''), 2000)
    }
  }, [addComponent, setIsGenerating, setError])

  return {
    generateComponent,
    progress
  }
}

// TODO: Move to separate file
async function validateCode(code: string): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []
  
  // Basic syntax check
  if (!code.includes('export')) {
    errors.push('Component must have export statement')
  }
  
  // Security check
  if (code.includes('eval(') || code.includes('Function(')) {
    errors.push('Code contains unsafe eval/Function')
  }
  
  if (code.includes('dangerouslySetInnerHTML')) {
    errors.push('Code contains dangerouslySetInnerHTML')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

function getDefaultDesignTokens() {
  // TODO: Get from theme context
  return {
    colors: {
      primary: { 500: '#3b82f6' },
      secondary: { 500: '#8b5cf6' },
      neutral: { 500: '#6b7280' },
      semantic: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      }
    },
    typography: {
      fontFamily: { sans: 'Inter, sans-serif', serif: 'Georgia', mono: 'monospace' },
      fontSize: {},
      fontWeight: {},
      lineHeight: {}
    },
    spacing: {},
    borderRadius: {},
    shadows: {},
    breakpoints: {}
  }
}
```

---

## Week 5-8: Build Live Preview Workspace

### Create Builder Workspace

Create `src/components/builder/BuilderWorkspace.tsx`:

```typescript
import React, { useState } from 'react'
import { PromptPanel } from './PromptPanel'
import { ComponentTree } from './ComponentTree'
import { LivePreview } from './LivePreview'
import { CodeEditor } from './CodeEditor'
import { useBuilderStore } from '@/store/builder-store'

export function BuilderWorkspace() {
  const { componentTree, currentCode } = useBuilderStore()
  const [previewSize, setPreviewSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Left Sidebar */}
      <div className="w-80 border-r border-gray-800 flex flex-col">
        <PromptPanel />
        <ComponentTree tree={componentTree} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4">
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 rounded ${previewSize === 'mobile' ? 'bg-blue-600' : 'bg-gray-800'}`}
              onClick={() => setPreviewSize('mobile')}
            >
              📱 Mobile
            </button>
            <button
              className={`px-3 py-1 rounded ${previewSize === 'tablet' ? 'bg-blue-600' : 'bg-gray-800'}`}
              onClick={() => setPreviewSize('tablet')}
            >
              💻 Tablet
            </button>
            <button
              className={`px-3 py-1 rounded ${previewSize === 'desktop' ? 'bg-blue-600' : 'bg-gray-800'}`}
              onClick={() => setPreviewSize('desktop')}
            >
              🖥️ Desktop
            </button>
          </div>

          <div className="flex gap-2">
            <button className="px-3 py-1 rounded bg-gray-800">Export</button>
            <button className="px-3 py-1 rounded bg-blue-600">Deploy</button>
          </div>
        </div>

        {/* Split View: Preview + Code */}
        <div className="flex-1 flex">
          {/* Preview */}
          <div className="flex-1 p-4">
            <LivePreview code={currentCode} size={previewSize} />
          </div>

          {/* Code Editor */}
          <div className="w-1/2 border-l border-gray-800">
            <CodeEditor />
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## Testing Your Implementation

### Test 1: Basic Component Generation

```typescript
// Create a test file: src/__tests__/generation.test.ts
import { llmClient } from '@/services/ai/llm-client'

test('generates a button component', async () => {
  const response = await llmClient.generateComponent({
    prompt: 'Create a blue button that says "Click me"',
    designSystem: getTestDesignTokens(),
    options: {
      framework: 'react',
      typescript: true,
      styling: 'tailwind',
      accessibility: true
    }
  })

  expect(response.code).toContain('button')
  expect(response.code).toContain('Click me')
  expect(response.componentType).toBe('Button')
})
```

### Test 2: Manual Testing Workflow

1. Start dev server: `npm run dev`
2. Open browser console
3. Test LLM client:
```javascript
const { llmClient } = await import('./src/services/ai/llm-client.ts')
const result = await llmClient.generateComponent({
  prompt: 'Create a login form with email and password',
  designSystem: {},
  options: { framework: 'react', typescript: true, styling: 'tailwind', accessibility: true }
})
console.log(result.code)
```

---

## Common Issues & Solutions

### Issue 1: CORS Errors with OpenAI API

**Problem:** Browser blocks API requests

**Solution:** 
- Short-term: Use `dangerouslyAllowBrowser: true` (dev only)
- Long-term: Create backend proxy:

```typescript
// backend/api/generate.ts
export default async function handler(req, res) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const completion = await openai.chat.completions.create(req.body)
  res.json(completion)
}
```

### Issue 2: Gaze Tracking Interferes with Preview

**Problem:** Gaze overlay blocks clicks in preview iframe

**Solution:** Use pointer-events CSS
```css
.gaze-overlay {
  pointer-events: none;
  z-index: 9999;
}
```

### Issue 3: Generated Code Has Syntax Errors

**Problem:** LLM outputs invalid TypeScript

**Solution:** Add validation layer:
```typescript
import * as babel from '@babel/parser'

function validateSyntax(code: string): boolean {
  try {
    babel.parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] })
    return true
  } catch {
    return false
  }
}
```

---

## Next Steps

Once you have Week 1-8 implemented:

1. **Week 9-10:** Gaze analytics integration
2. **Week 11-12:** Design system & component library
3. **Week 13-16:** Export & deployment features
4. **Week 17-20:** Collaboration features
5. **Week 21-24:** Polish & optimization

---

## Resources

- **OpenAI API Docs:** https://platform.openai.com/docs
- **Sandpack Docs:** https://sandpack.codesandbox.io/docs
- **Zustand Docs:** https://github.com/pmndrs/zustand
- **WebGazer.js Docs:** https://webgazer.cs.brown.edu

---

**Need help?** Check the main development plan document for detailed architecture and API specifications.


