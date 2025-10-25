import { Intent, ElementLock } from '@/types';

export interface ApplyResult {
  success: boolean;
  message: string;
  appliedStyles?: Record<string, string>;
}

/**
 * Apply intent to locked element with validation
 */
export function applyIntent(lock: ElementLock, intent: Intent): ApplyResult {
  if (!lock.element || !document.body.contains(lock.element)) {
    return { success: false, message: 'Element no longer exists' };
  }

  try {
    if (intent.action === 'text.replace') {
      const newText = intent.targetProps.text as string;
      if (!newText) {
        return { success: false, message: 'No text provided' };
      }
      lock.element.textContent = newText;
      return { 
        success: true, 
        message: `Changed text to: "${newText}"`,
        appliedStyles: { textContent: newText }
      };
    }

    if (intent.action === 'style.update') {
      const appliedStyles: Record<string, string> = {};
      
      for (const [prop, value] of Object.entries(intent.targetProps)) {
        const styleValue = String(value);
        (lock.element.style as any)[prop] = styleValue;
        appliedStyles[prop] = styleValue;
      }

      const summary = Object.entries(appliedStyles)
        .map(([k, v]) => `${k} → ${v}`)
        .join(', ');

      return { 
        success: true, 
        message: `Applied: ${summary}`,
        appliedStyles 
      };
    }

    return { success: false, message: 'Unknown action type' };
  } catch (error) {
    return { 
      success: false, 
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Revert element to original styles
 */
export function revertStyles(lock: ElementLock): void {
  if (!lock.element || !document.body.contains(lock.element)) return;

  for (const [prop, value] of Object.entries(lock.originalStyles)) {
    (lock.element.style as any)[prop] = value;
  }
}

/**
 * Capture current styles of an element
 */
export function captureStyles(element: HTMLElement, props: string[]): Record<string, string> {
  const styles: Record<string, string> = {};
  for (const prop of props) {
    styles[prop] = (element.style as any)[prop] || '';
  }
  return styles;
}
