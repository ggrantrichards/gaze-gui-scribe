import { z } from 'zod';

export const IntentSchema = z.object({
  action: z.enum(['style.update', 'text.replace']),
  targetProps: z.record(z.string(), z.union([z.string(), z.number()])),
});

export const ElementLockSchema = z.object({
  id: z.string(),
  role: z.string(),
  bbox: z.object({ 
    x: z.number(), 
    y: z.number(), 
    w: z.number(), 
    h: z.number() 
  }),
  element: z.custom<HTMLElement>(),
  originalStyles: z.record(z.string(), z.string()),
});

export type Intent = z.infer<typeof IntentSchema>;
export type ElementLock = z.infer<typeof ElementLockSchema>;

export interface GazePoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface CalibrationPoint {
  x: number;
  y: number;
  index: number;
}
