import type { ElementLock, Intent } from '@/types'

export function captureStyles(el: HTMLElement, props: string[]): Record<string,string> {
  const cs = window.getComputedStyle(el)
  const snapshot: Record<string,string> = {}
  for (const p of props) snapshot[p] = (cs as any)[p] ?? ''
  return snapshot
}

export function revertStyles(lock: ElementLock) {
  for (const [k,v] of Object.entries(lock.originalStyles)) {
    ;(lock.element.style as any)[k] = v
  }
}

const ALLOWLIST = new Set([
  'backgroundColor','color','fontSize','padding','margin',
  'borderRadius','border','width','height'
])

export function applyIntent(lock: ElementLock, intent: Intent): { success:boolean; message:string } {
  if (intent.action === 'text.replace') {
    if ('innerText' in lock.element) {
      lock.element.innerText = intent.newText || ''
      return { success:true, message:`Text set to “${intent.newText}”.` }
    }
    return { success:false, message:'Target element has no innerText.' }
  }

  if (intent.action === 'style.update' && intent.targetProps) {
    for (const [prop, val] of Object.entries(intent.targetProps)) {
      if (!ALLOWLIST.has(prop)) return { success:false, message:`Property ${prop} not allowed.` }
      ;(lock.element.style as any)[prop] = String(val)
    }
    return { success:true, message:`Applied ${Object.keys(intent.targetProps).join(', ')}.` }
  }
  return { success:false, message:'Unsupported intent.' }
}
