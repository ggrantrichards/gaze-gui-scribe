// import type { Intent } from '@/types'
// import { GoogleGenerativeAI } from "@google/generative-ai";

// const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// const result = await model.generateContent("Hello Gemini!");

// const namedColors: Record<string,string> = {
//   red:'#ef4444', blue:'#3b82f6', green:'#10b981', yellow:'#f59e0b',
//   purple:'#8b5cf6', orange:'#f97316', pink:'#ec4899', black:'#000000', white:'#ffffff'
// }

// export function parseInstruction(instruction: string): Intent | null {
//   const t = instruction.trim().toLowerCase()
//   if (!t) return null

//   // page-creation hints (no-op here but kept for future extensibility)
//   if (/\bcreate\b|\badd\b.*\bpage\b/.test(t)) {
//     return { action:'style.update', targetProps: {} } // placeholder for page-level intents
//   }

//   // text replacement
//   const textMatch = t.match(/change\s+text\s+to\s+['"](.+?)['"]/)
//   if (textMatch) return { action:'text.replace', newText: textMatch[1] }

//   // color names / hex
//   const targetProps: Record<string, string | number> = {}
//   const colorName = Object.keys(namedColors).find(c =>
//     t.includes(`make this ${c}`) || t.includes(`make it ${c}`) ||
//     t.includes(`set color to ${c}`) || t.includes(`set background to ${c}`)
//   )
//   if (colorName) {
//     if (t.includes('background') || t.includes('bg')) targetProps['backgroundColor'] = namedColors[colorName]
//     else targetProps['color'] = namedColors[colorName]
//   }
//   const hex = t.match(/#([0-9a-f]{3}|[0-9a-f]{6})/i)
//   if (hex) targetProps['backgroundColor'] = hex[0]

//   // font size
//   const fs = t.match(/font\s*size\s*(?:to|=)?\s*(\d+)\s*px/)
//   if (fs) targetProps['fontSize'] = `${fs[1]}px`

//   // padding
//   const pad = t.match(/padding\s*(?:to|=|by)?\s*(\d+)\s*px?/)
//   if (pad) targetProps['padding'] = `${pad[1]}px`

//   // border radius
//   if (t.includes('rounded corners') || t.match(/border\s*radius/)) {
//     const r = t.match(/(\d+)\s*px/)
//     targetProps['borderRadius'] = r ? `${r[1]}px` : '8px'
//   }

//   if (Object.keys(targetProps).length > 0) return { action:'style.update', targetProps }
//   return null
// }

// src/utils/nlpParser.ts
import type { Intent } from '@/types'

const namedColors: Record<string, string> = {
  red:'#ef4444', blue:'#3b82f6', green:'#10b981', yellow:'#f59e0b',
  purple:'#8b5cf6', orange:'#f97316', pink:'#ec4899', black:'#000000', white:'#ffffff'
}

function parseInstructionLocal(instruction: string): Intent | null {
  const t = instruction.trim().toLowerCase()
  if (!t) return null

  const textMatch = t.match(/change\s+text\s+to\s+['"](.+?)['"]/)
  if (textMatch) return { action:'text.replace', newText: textMatch[1] }

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

  const fs = t.match(/font\s*size\s*(?:to|=)?\s*(\d+)\s*px/); if (fs) targetProps['fontSize'] = `${fs[1]}px`
  const pad = t.match(/padding\s*(?:to|=|by)?\s*(\d+)\s*px?/); if (pad) targetProps['padding'] = `${pad[1]}px`

  if (t.includes('rounded corners') || /border\s*radius/.test(t)) {
    const r = t.match(/(\d+)\s*px/); targetProps['borderRadius'] = r ? `${r[1]}px` : '8px'
  }

  return Object.keys(targetProps).length ? { action:'style.update', targetProps } : null
}

type GeminiModel = { generateContent: (args: any) => Promise<{ response: { text(): string } }> }
let geminiModel: GeminiModel | null = null

async function getModel(): Promise<GeminiModel | null> {
  try {
    const key = import.meta.env.VITE_GEMINI_API_KEY
    if (!key) return null
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(key)
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }) as unknown as GeminiModel
    return geminiModel
  } catch { return null }
}

function truncate(str: string, max = 1200) { return str.length <= max ? str : str.slice(0, max) + '…' }
function serializeElement(el?: HTMLElement | null) {
  if (!el) return ''
  const tag = el.tagName.toLowerCase()
  const id = el.id ? `#${el.id}` : ''
  const cls = el.className ? `.${String(el.className).trim().split(/\s+/).join('.')}` : ''
  const role = el.getAttribute('role') || ''
  const outer = truncate(el.outerHTML.replace(/\s+/g, ' ').trim(), 1000)
  const cs = getComputedStyle(el)
  const styleBrief = [
    `color:${cs.color}`, `bg:${cs.backgroundColor}`, `fs:${cs.fontSize}`,
    `pad:${cs.padding}`, `radius:${cs.borderRadius}`, `border:${cs.border}`
  ].join('; ')
  return `elem:<${tag}${id}${cls}${role ? ` role="${role}"` : ''}>|styles:${styleBrief}|outer:${outer}`
}

export async function parseInstructionSmart(instruction: string, element?: HTMLElement | null): Promise<Intent | null> {
  const local = parseInstructionLocal(instruction)
  if (local) return local

  const model = geminiModel || await getModel()
  if (!model) return null

  const sys = `You output ONLY minified JSON intents:
{"action":"text.replace","newText":"..."}
or
{"action":"style.update","targetProps":{...}}
If unsure, output {"action":"style.update","targetProps":{}}.`
  const user = `Instruction: "${instruction}"\nContext: ${serializeElement(element)}\nOutput: JSON only.`
  try {
    const res = await model.generateContent([{ role:'user', parts:[{ text: sys + '\n' + user }] }])
    const txt = res.response.text().trim()
    const s = txt.indexOf('{'), e = txt.lastIndexOf('}')
    if (s >= 0 && e >= s) return JSON.parse(txt.slice(s, e + 1))
  } catch {}
  return null
}

const FALLBACK_SUGGESTIONS: Record<string, string[]> = {
  button: ['Change text to "Save"', 'Make this blue', 'Add rounded corners', 'Increase padding by 8'],
  input: ['Change placeholder to "Search..."', 'Increase padding by 6', 'Make this yellow', 'Widen to 320px'],
  textarea: ['Increase height to 120px', 'Make this green', 'Add rounded corners', 'Increase padding by 8'],
  default: ['Make this blue', 'Change font size to 20px', 'Duplicate card', 'Add rounded corners'],
}

export async function aiSuggestionsForElement(el: HTMLElement | null): Promise<string[]> {
  if (!el) return []
  const model = geminiModel || await getModel()
  if (!model) {
    const tag = el.tagName.toLowerCase()
    return (FALLBACK_SUGGESTIONS as any)[tag] || FALLBACK_SUGGESTIONS.default
  }
  const sys = `Return ONLY a JSON array (≤6) of short UI edit commands for this element.`
  const user = serializeElement(el)
  try {
    const res = await model.generateContent([{ role:'user', parts:[{ text: sys + '\n' + user }] }])
    const arr = JSON.parse(res.response.text().trim())
    if (Array.isArray(arr)) return arr.slice(0, 6).map(String)
  } catch {}
  const tag = el.tagName.toLowerCase()
  return (FALLBACK_SUGGESTIONS as any)[tag] || FALLBACK_SUGGESTIONS.default
}
