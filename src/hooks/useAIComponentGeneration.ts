/**
 * AI Component Generation Hook
 * Integrates Fetch.ai agents with existing gaze tracking
 * 
 * Cal Hacks 12.0: This demonstrates multi-agent AI system for $4,000 prize
 * 
 * Key features:
 * - Generates components from text prompts using Fetch.ai agents
 * - Optimizes components based on real-time gaze data
 * - Preserves existing gaze-based interaction (look + click)
 */

import { useState, useCallback, useEffect } from 'react'
import { agentCoordinator } from '@/services/agents/agent-coordinator'
import type {
  ComponentGenerationRequest,
  ComponentGenerationResponse,
  GazeOptimizationResponse,
  ComponentNode,
  GazePoint
} from '@/types'

interface UseAIComponentGenerationProps {
  gazeData?: GazePoint[]
  onComponentGenerated?: (component: ComponentNode) => void
  onOptimizationSuggested?: (suggestions: GazeOptimizationResponse) => void
}

export function useAIComponentGeneration({
  gazeData,
  onComponentGenerated,
  onOptimizationSuggested
}: UseAIComponentGenerationProps = {}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<string>('')
  const [lastGenerated, setLastGenerated] = useState<ComponentNode | null>(null)

  /**
   * Generate component from text prompt
   * Uses Fetch.ai Component Generator Agent
   */
  const generateComponent = useCallback(async (prompt: string) => {
    if (!prompt.trim()) {
      setError('Please provide a prompt')
      return null
    }

    setIsGenerating(true)
    setError(null)
    setProgress('Initializing agent...')

    try {
      // Build request with gaze context if available
      const request: ComponentGenerationRequest = {
        prompt,
        gazeContext: gazeData ? analyzeGazeContext(gazeData) : undefined,
        designTokens: getDefaultDesignTokens(),
        constraints: []
      }

      setProgress('Agent is generating component...')

      // Call Fetch.ai agent
      const response: ComponentGenerationResponse = await agentCoordinator.generateComponent(request)

      setProgress('Validating code...')

      // Create component node with unique ID (timestamp + random)
      const component: ComponentNode = {
        id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: response.componentType,
        name: response.componentType,
        code: response.code,
        props: {},
        children: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: 'agent',
        agentType: 'component-generator'
      }

      setLastGenerated(component)
      setProgress('Done!')
      
      // Callback to parent
      if (onComponentGenerated) {
        onComponentGenerated(component)
      }

      // Auto-clear progress after 2 seconds
      setTimeout(() => setProgress(''), 2000)

      return component
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed'
      setError(message)
      setProgress('')
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [gazeData, onComponentGenerated])

  /**
   * Optimize component based on gaze data
   * Uses Fetch.ai Gaze Optimizer Agent
   * 
   * This is the UNIQUE VALUE PROP for Cal Hacks!
   */
  const optimizeWithGaze = useCallback(async (
    componentId: string,
    currentCode: string,
    recentGazeData: GazePoint[]
  ) => {
    if (!recentGazeData || recentGazeData.length === 0) {
      setError('No gaze data available for optimization')
      return null
    }

    setIsOptimizing(true)
    setError(null)
    setProgress('Analyzing gaze patterns...')

    try {
      setProgress('Agent is generating optimization suggestions...')

      // Call Fetch.ai Gaze Optimizer Agent
      const optimization: GazeOptimizationResponse = await agentCoordinator.optimizeWithGaze({
        componentId,
        currentCode,
        gazeData: recentGazeData
      })

      setProgress('Suggestions ready!')

      // Callback to parent
      if (onOptimizationSuggested) {
        onOptimizationSuggested(optimization)
      }

      // Auto-clear progress
      setTimeout(() => setProgress(''), 2000)

      return optimization
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Optimization failed'
      setError(message)
      setProgress('')
      return null
    } finally {
      setIsOptimizing(false)
    }
  }, [onOptimizationSuggested])

  /**
   * Quick generate - convenience method for common components
   */
  const quickGenerate = useCallback((componentType: 'button' | 'form' | 'card' | 'hero') => {
    const prompts = {
      button: 'Create a modern, accessible button component',
      form: 'Create a login form with email and password fields',
      card: 'Create a card component with image, title, and description',
      hero: 'Create a hero section with heading, description, and CTA buttons'
    }

    return generateComponent(prompts[componentType])
  }, [generateComponent])

  /**
   * Get agents status for UI display
   */
  const agentsStatus = agentCoordinator.getAgentsStatus()

  return {
    // Component generation
    generateComponent,
    quickGenerate,
    isGenerating,
    lastGenerated,

    // Gaze optimization
    optimizeWithGaze,
    isOptimizing,

    // Status
    progress,
    error,
    agentsStatus,
    isReady: agentCoordinator.isReady()
  }
}

/**
 * Helper: Analyze gaze data to create context for AI
 */
function analyzeGazeContext(gazeData: GazePoint[]): {
  topAttentionAreas: string[]
  avgDwellTime: number
  totalFixations: number
  scanpathComplexity: number
} {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // Divide screen into quadrants
  const quadrants = {
    'top-left': 0,
    'top-right': 0,
    'bottom-left': 0,
    'bottom-right': 0
  }

  gazeData.forEach(point => {
    const isLeft = point.x < viewportWidth / 2
    const isTop = point.y < viewportHeight / 2

    if (isTop && isLeft) quadrants['top-left']++
    else if (isTop && !isLeft) quadrants['top-right']++
    else if (!isTop && isLeft) quadrants['bottom-left']++
    else quadrants['bottom-right']++
  })

  // Find top attention areas
  const topAttentionAreas = Object.entries(quadrants)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([area]) => area)

  // Calculate average dwell time (simplified)
  const avgDwellTime = gazeData.length > 0 
    ? (gazeData[gazeData.length - 1].timestamp - gazeData[0].timestamp) / gazeData.length
    : 0

  // Scanpath complexity (how much user's eyes jump around)
  let complexity = 0
  for (let i = 1; i < gazeData.length; i++) {
    const dx = gazeData[i].x - gazeData[i - 1].x
    const dy = gazeData[i].y - gazeData[i - 1].y
    complexity += Math.sqrt(dx * dx + dy * dy)
  }

  return {
    topAttentionAreas,
    avgDwellTime,
    totalFixations: gazeData.length,
    scanpathComplexity: complexity
  }
}

/**
 * Helper: Get default design tokens
 * TODO: Move to theme context
 */
function getDefaultDesignTokens() {
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

