export interface GazePoint {
  x: number; // pixel X
  y: number; // pixel Y
  timestamp: number; // ms
  confidence?: number;
}

export type IntentAction = 'style.update' | 'text.replace';

export type Intent = {
  action: IntentAction;
  targetProps?: Record<string, string | number>;
  newText?: string;
};

export type ElementLock = {
  id: string;
  role: string;
  bbox: { x: number; y: number; w: number; h: number };
  element: HTMLElement;
  originalStyles: Record<string,string>;
};
