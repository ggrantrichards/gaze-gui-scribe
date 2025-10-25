import type { Intent } from '@/types'
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const result = await model.generateContent("Hello Gemini!");

const namedColors: Record<string,string> = {
  red:'#ef4444', blue:'#3b82f6', green:'#10b981', yellow:'#f59e0b',
  purple:'#8b5cf6', orange:'#f97316', pink:'#ec4899', black:'#000000', white:'#ffffff'
}

export function parseInstruction(instruction: string): Intent | null {
  const t = instruction.trim().toLowerCase()
  if (!t) return null

  // page-creation hints (no-op here but kept for future extensibility)
  if (/\bcreate\b|\badd\b.*\bpage\b/.test(t)) {
    return { action:'style.update', targetProps: {} } // placeholder for page-level intents
  }

  // text replacement
  const textMatch = t.match(/change\s+text\s+to\s+['"](.+?)['"]/)
  if (textMatch) return { action:'text.replace', newText: textMatch[1] }

  // color names / hex
  const targetProps: Record<string, string | number> = {}
  const colorName = Object.keys(namedColors).find(c =>
    t.includes(`make this ${c}`) || t.includes(`make it ${c}`) ||
    t.includes(`set color to ${c}`) || t.includes(`set background to ${c}`)
  )
  if (colorName) {
    if (t.includes('background') || t.includes('bg')) targetProps['backgroundColor'] = namedColors[colorName]
    else targetProps['color'] = namedColors[colorName]
  }
  const hex = t.match(/#([0-9a-f]{3}|[0-9a-f]{6})/i)
  if (hex) targetProps['backgroundColor'] = hex[0]

  // font size
  const fs = t.match(/font\s*size\s*(?:to|=)?\s*(\d+)\s*px/)
  if (fs) targetProps['fontSize'] = `${fs[1]}px`

  // padding
  const pad = t.match(/padding\s*(?:to|=|by)?\s*(\d+)\s*px?/)
  if (pad) targetProps['padding'] = `${pad[1]}px`

  // border radius
  if (t.includes('rounded corners') || t.match(/border\s*radius/)) {
    const r = t.match(/(\d+)\s*px/)
    targetProps['borderRadius'] = r ? `${r[1]}px` : '8px'
  }

  if (Object.keys(targetProps).length > 0) return { action:'style.update', targetProps }
  return null
}
