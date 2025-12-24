import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { GazePoint } from '@/types'
import { aiSuggestionsForElement } from '@/utils/nlpParser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, MousePointer2 } from 'lucide-react'

type Props = {
  visible: boolean
  gaze: GazePoint | null
  focusedEl: HTMLElement | null
  onPick: (suggestion: string) => void
}

function localSuggestionsFor(el: HTMLElement | null): string[] {
  if (!el) return []
  const tag = el.tagName.toLowerCase()

  if (tag === 'button') {
    return [
      'Change text to "Save"',
      'Make this blue',
      'Add rounded corners',
      'Increase padding by 8',
      'Add subtle shadow',
    ]
  }
  if (tag === 'input' || tag === 'textarea' || el.getAttribute('contenteditable') === 'true') {
    return [
      'Change placeholder to "Search..."',
      'Increase padding by 6',
      'Make this yellow',
      'Set font size to 18px',
      'Widen by 20%',
    ]
  }
  return [
    'Make this blue',
    'Add rounded corners',
    'Change font size to 20px',
    'Duplicate card',
    'Add subtle shadow',
  ]
}

function aiEnabled(): boolean {
  const hasOpenAI = Boolean((import.meta as any)?.env?.VITE_OPENAI_API_KEY)
  const hasGemini = Boolean((import.meta as any)?.env?.VITE_GEMINI_API_KEY)
  const runtimeFlag = (window as any).__AI_ENABLED__
  const anyKeyPresent = hasOpenAI || hasGemini
  const effective = runtimeFlag ?? anyKeyPresent
  return Boolean(effective)
}

export function AutoSuggestionPanel({ visible, gaze, focusedEl, onPick }: Props) {
  const [items, setItems] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const pos = useMemo(() => {
    const x = gaze?.x ?? 0
    const y = gaze?.y ?? 0
    return {
      left: Math.min(x + 14, window.innerWidth - 260),
      top: Math.min(y + 14, window.innerHeight - 10),
    }
  }, [gaze?.x, gaze?.y])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!focusedEl) {
        if (!cancelled && mountedRef.current) {
          setItems([])
          setLoading(false)
        }
        return
      }
      if (!cancelled && mountedRef.current) setLoading(true)
      try {
        let out: string[] = []
        if (aiEnabled()) {
          out = await aiSuggestionsForElement(focusedEl)
        } else {
          out = localSuggestionsFor(focusedEl)
        }
        if (!cancelled && mountedRef.current) {
          setItems(out.slice(0, 4))
        }
      } catch {
        const out = localSuggestionsFor(focusedEl)
        if (!cancelled && mountedRef.current) {
          setItems(out.slice(0, 4))
        }
      } finally {
        if (!cancelled && mountedRef.current) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [focusedEl])

  if (!visible || !gaze || (!items.length && !loading)) return null

  return (
    <div 
      className="fixed z-[9998] w-[260px] animate-in fade-in zoom-in-95 duration-200"
      style={{ left: pos.left, top: pos.top }}
    >
      <Card className="shadow-2xl border-primary-100 bg-white/95 backdrop-blur-sm overflow-hidden">
        <CardHeader className="p-3 bg-primary-50/50 border-b border-primary-100">
          <CardTitle className="text-[10px] font-bold flex items-center gap-2 uppercase tracking-wider text-primary-700">
            {loading ? <Sparkles className="w-3 h-3 animate-pulse" /> : <MousePointer2 className="w-3 h-3" />}
            {loading ? 'Analyzing with AI...' : 'Smart Suggestions'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 space-y-1">
          {loading && (
            <div className="flex flex-col gap-2 p-2">
              <div className="h-8 bg-slate-100 animate-pulse rounded" />
              <div className="h-8 bg-slate-100 animate-pulse rounded w-[80%]" />
            </div>
          )}
          {!loading && items.map((s, i) => (
            <Button
              key={i}
              variant="ghost"
              size="sm"
              onClick={() => onPick(s)}
              className="w-full justify-start text-xs font-medium hover:bg-primary-50 hover:text-primary-700 h-8"
            >
              {s}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
