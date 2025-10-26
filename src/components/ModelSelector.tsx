/**
 * Model Selector Component
 * Allows users to choose which LLM to use for generation
 * Claude 3.5, GPT-4, Llama, Mixtral, etc.
 */

import React, { useState, useEffect } from 'react'

interface Model {
  id: string
  name: string
  strength: string
  speed: string
  quality: string
  cost: string
}

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (modelId: string) => void
  className?: string
}

export function ModelSelector({ selectedModel, onModelChange, className = '' }: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [openRouterAvailable, setOpenRouterAvailable] = useState(false)

  useEffect(() => {
    // Fetch available models from backend
    const fetchModels = async () => {
      try {
        const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
        const response = await fetch(`${backendURL}/api/models`)
        if (response.ok) {
          const data = await response.json()
          setModels(data.models || [])
          setOpenRouterAvailable(data.openrouter_available)
        }
      } catch (error) {
        console.error('Failed to fetch models:', error)
        // Fallback to default models
        setModels([
          {
            id: 'claude-3.5-sonnet',
            name: 'Claude 3.5 Sonnet',
            strength: 'Best for modern UI/UX',
            speed: 'medium',
            quality: 'excellent',
            cost: 'medium'
          },
          {
            id: 'gpt-4-turbo',
            name: 'GPT-4 Turbo',
            strength: 'Reliable components',
            speed: 'medium',
            quality: 'excellent',
            cost: 'high'
          },
          {
            id: 'llama-3.1-70b',
            name: 'Llama 3.1 70B',
            strength: 'Fast generation',
            speed: 'fast',
            quality: 'good',
            cost: 'free'
          }
        ])
      }
    }

    fetchModels()
  }, [])

  const selectedModelData = models.find(m => m.id === selectedModel) || models[0]

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'best':
      case 'excellent':
        return 'text-green-400'
      case 'good':
        return 'text-blue-400'
      default:
        return 'text-gray-400'
    }
  }

  const getSpeedBadge = (speed: string) => {
    switch (speed) {
      case 'fast':
        return '⚡'
      case 'medium':
        return '⏱️'
      case 'slow':
        return '🐢'
      default:
        return ''
    }
  }

  const getCostBadge = (cost: string) => {
    switch (cost) {
      case 'free':
        return '🆓'
      case 'low':
        return '💵'
      case 'medium':
        return '💰'
      case 'high':
      case 'highest':
        return '💎'
      default:
        return ''
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Selected Model Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-lg transition-colors border border-slate-600"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getSpeedBadge(selectedModelData?.speed || '')} {getCostBadge(selectedModelData?.cost || '')}</span>
          <div className="text-left">
            <div className="font-semibold">{selectedModelData?.name || 'Select Model'}</div>
            <div className="text-xs text-slate-400">{selectedModelData?.strength}</div>
          </div>
        </div>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute top-full mt-2 w-full bg-slate-800 rounded-lg shadow-xl border border-slate-600 z-50 max-h-96 overflow-y-auto">
            {!openRouterAvailable && (
              <div className="p-3 bg-amber-900/20 border-b border-amber-700/50">
                <p className="text-xs text-amber-300">
                  ⚠️ OpenRouter not configured. Add OPENROUTER_API_KEY to .env
                </p>
              </div>
            )}

            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onModelChange(model.id)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0 ${
                  selectedModel === model.id ? 'bg-slate-700/50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{model.name}</span>
                      <span className="text-sm">{getSpeedBadge(model.speed)}</span>
                      <span className="text-sm">{getCostBadge(model.cost)}</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{model.strength}</p>
                    <div className="flex gap-3 text-xs">
                      <span className="text-slate-500">
                        Speed: <span className={getQualityColor(model.speed)}>{model.speed}</span>
                      </span>
                      <span className="text-slate-500">
                        Quality: <span className={getQualityColor(model.quality)}>{model.quality}</span>
                      </span>
                    </div>
                  </div>
                  {selectedModel === model.id && (
                    <div className="text-green-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}

            <div className="p-3 bg-slate-900 text-xs text-slate-400">
              <p>💡 <strong>Claude 3.5</strong> recommended for full landing pages</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

