import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { GazePoint } from '@/types'
import { aiSuggestionsForElement } from '@/utils/nlpParser'

type Props = {
  visible: boolean
  gaze: GazePoint | null
  focusedEl: HTMLElement | null
  onPick: (suggestion: string) => void
}

/** Local heuristic suggestions used as a fallback when AI is unavailable or errors. */
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
  // Containers / text / default
  return [
    'Make this blue',
    'Add rounded corners',
    'Change font size to 20px',
    'Duplicate card',
    'Add subtle shadow',
  ]
}

/** Build-time check for available AI keys. Works with either OpenAI or Gemini envs. */
function aiEnabled(): boolean {
  // Vite exposes env vars at build time via import.meta.env
  const hasOpenAI = Boolean((import.meta as any)?.env?.VITE_OPENAI_API_KEY)
  const hasGemini = Boolean((import.meta as any)?.env?.VITE_GEMINI_API_KEY)
  // Optional runtime override for tests/demos
  const runtimeFlag = (window as any).__AI_ENABLED__

  // Avoid mixing ?? with || (which requires parens in Babel).
  const anyKeyPresent = hasOpenAI || hasGemini
  const effective = runtimeFlag ?? anyKeyPresent
  return Boolean(effective)
}

export function AutoSuggestionPanel({ visible, gaze, focusedEl, onPick }: Props) {
  const [items, setItems] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Track mounted state to avoid setState after unmount.
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Compute position FIRST to keep Hooks order stable across renders.
  const pos = useMemo(() => {
    const x = gaze?.x ?? 0
    const y = gaze?.y ?? 0
    return {
      left: Math.min(x + 14, window.innerWidth - 260),
      top: Math.min(y + 14, window.innerHeight - 10),
    }
  }, [gaze?.x, gaze?.y])

  // Re-fetch suggestions whenever the hovered/focused element changes.
  useEffect(() => {
    let cancelled = false

    async function load() {
      // If nothing is focused, clear suggestions.
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
          // Try AI first
          out = await aiSuggestionsForElement(focusedEl)
        } else {
          // No API key configured -> local heuristics
          out = localSuggestionsFor(focusedEl)
        }

        if (!cancelled && mountedRef.current) {
          setItems(out.slice(0, 4))
        }
      } catch {
        // On any failure, gracefully fall back to local suggestions
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

  // After computing pos (above), we can safely early-return without affecting hook order.
  if (!visible || !gaze || (!items.length && !loading)) return null

  return (
    <div style={{
      position: 'fixed', left: pos.left, top: pos.top,
      width: 240, zIndex: 9998,
      background: 'rgba(15,23,42,0.96)', border: '1px solid #334155', borderRadius: 12, padding: 8
    }}>
      <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
        {loading ? 'Suggestions (AI)…' : 'Suggestions'}
      </div>

      {loading && (
        <div className="muted" style={{ padding: '6px 8px' }}>
          Thinking…
        </div>
      )}

      {!loading && items.map((s, i) => (
        <button
          key={i}
          onClick={() => onPick(s)}
          className="btn secondary"
          style={{ width: '100%', textAlign: 'left', marginBottom: 6 }}
        >
          {s}
        </button>
      ))}
    </div>
  )
}