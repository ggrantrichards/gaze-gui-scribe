/**
 * Component Generation Panel
 * UI for text-to-component generation using Fetch.ai agents
 * 
 * Cal Hacks 12.0: Demonstrates AI agent system for $4,000 prize
 * Integrates with existing gaze tracking WITHOUT breaking it
 */

import React, { useState, useEffect } from 'react'
import { useAIComponentGeneration } from '@/hooks/useAIComponentGeneration'
import { ModelSelector } from './ModelSelector'
import type { ComponentNode, GazePoint, GazeOptimizationResponse } from '@/types'

interface ComponentGenerationPanelProps {
  visible: boolean
  onClose: () => void
  onComponentGenerated: (component: ComponentNode) => void
  recentGazeData?: GazePoint[]
}

export function ComponentGenerationPanel({
  visible,
  onClose,
  onComponentGenerated,
  recentGazeData
}: ComponentGenerationPanelProps) {
  const [prompt, setPrompt] = useState('')
  const [selectedModel, setSelectedModel] = useState('claude-3.5-sonnet')
  const [optimizations, setOptimizations] = useState<GazeOptimizationResponse | null>(null)

  const {
    generateComponent,
    quickGenerate,
    isGenerating,
    lastGenerated,
    optimizeWithGaze,
    isOptimizing,
    progress,
    error,
    agentsStatus
  } = useAIComponentGeneration({
    gazeData: recentGazeData,
    onComponentGenerated,
    onOptimizationSuggested: setOptimizations
  })

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    await generateComponent(prompt)
    setPrompt('') // Clear after generation
  }

  const handleQuickGenerate = async (type: 'button' | 'form' | 'card' | 'hero') => {
    await quickGenerate(type)
  }

  const handleOptimize = async () => {
    if (!lastGenerated || !recentGazeData) return
    await optimizeWithGaze(lastGenerated.id, lastGenerated.code, recentGazeData)
  }

  // Auto-optimize when component is generated and gaze data exists
  useEffect(() => {
    if (lastGenerated && recentGazeData && recentGazeData.length > 50) {
      // Auto-optimize after 3 seconds of viewing
      const timer = setTimeout(() => {
        optimizeWithGaze(lastGenerated.id, lastGenerated.code, recentGazeData)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [lastGenerated, recentGazeData])

  if (!visible) return null

  return (
    <div
      className="fixed right-6 top-20 w-96 bg-slate-900 rounded-lg shadow-2xl border border-slate-700"
      style={{ maxHeight: 'calc(100vh - 120px)', overflow: 'auto', zIndex: 9997 }}
    >
      {/* Header */}
      <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white">AI Component Generator</h3>
          <p className="text-xs text-slate-400 mt-1">
            Powered by Fetch.ai Agents {agentsStatus.length > 0 && '🟢'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Model Selector */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            AI Model
          </label>
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>

        {/* Text Prompt Input */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            What would you like to create?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Try: 'A modern SaaS landing page' or 'Login form with social buttons'"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
            rows={3}
            disabled={isGenerating}
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {isGenerating ? 'Generating...' : 'Generate Component'}
          </button>
        </div>

        {/* Quick Actions */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Quick Generate:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickGenerate('button')}
              disabled={isGenerating}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm py-2 px-3 rounded-lg transition-colors"
            >
              Button
            </button>
            <button
              onClick={() => handleQuickGenerate('form')}
              disabled={isGenerating}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm py-2 px-3 rounded-lg transition-colors"
            >
              Form
            </button>
            <button
              onClick={() => handleQuickGenerate('card')}
              disabled={isGenerating}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm py-2 px-3 rounded-lg transition-colors"
            >
              Card
            </button>
            <button
              onClick={() => handleQuickGenerate('hero')}
              disabled={isGenerating}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm py-2 px-3 rounded-lg transition-colors"
            >
              Hero
            </button>
          </div>
        </div>

        {/* Progress */}
        {progress && (
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              <span className="text-sm text-blue-300">{progress}</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
            <p className="text-sm text-red-300">❌ {error}</p>
          </div>
        )}

        {/* Gaze Optimization Section (UNIQUE CAL HACKS FEATURE) */}
        {lastGenerated && recentGazeData && recentGazeData.length > 0 && (
          <div className="border-t border-slate-700 pt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-semibold text-slate-300">
                🧠 Gaze Optimization
              </h4>
              <span className="text-xs text-slate-500">
                {recentGazeData.length} gaze points tracked
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Analyze how users view this component and get AI suggestions
            </p>
            <button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
            >
              {isOptimizing ? 'Analyzing...' : 'Optimize with Gaze Data'}
            </button>
          </div>
        )}

        {/* Optimization Suggestions */}
        {optimizations && optimizations.suggestions.length > 0 && (
          <div className="border-t border-slate-700 pt-4 space-y-3">
            <h4 className="text-sm font-semibold text-slate-300">
              💡 AI Suggestions (Cal Hacks Demo)
            </h4>
            {optimizations.suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  suggestion.severity === 'high'
                    ? 'bg-red-900/20 border-red-700'
                    : suggestion.severity === 'medium'
                    ? 'bg-yellow-900/20 border-yellow-700'
                    : 'bg-blue-900/20 border-blue-700'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">
                    {suggestion.severity === 'high' ? '🔴' : suggestion.severity === 'medium' ? '🟡' : '🔵'}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white mb-1">
                      {suggestion.issue}
                    </p>
                    <p className="text-xs text-slate-400 mb-2">
                      {suggestion.recommendation}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Impact: +{suggestion.estimatedImpact}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <p className="text-xs text-purple-400 mt-2">
              ⭐ Predicted engagement improvement: +{optimizations.predictedImpact}%
            </p>
          </div>
        )}

        {/* Agent Status */}
        {agentsStatus.length > 0 && (
          <div className="border-t border-slate-700 pt-4">
            <h4 className="text-xs font-semibold text-slate-400 mb-2">
              Fetch.ai Agents Status
            </h4>
            <div className="space-y-1">
              {agentsStatus.map((agent) => (
                <div key={agent.type} className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">{agent.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] ${
                      agent.status === 'idle'
                        ? 'bg-green-900/30 text-green-400'
                        : agent.status === 'processing'
                        ? 'bg-blue-900/30 text-blue-400'
                        : 'bg-red-900/30 text-red-400'
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 p-3">
        <p className="text-[10px] text-slate-500 text-center">
          💡 Tip: Look at the generated component to track your gaze patterns
        </p>
      </div>
    </div>
  )
}

