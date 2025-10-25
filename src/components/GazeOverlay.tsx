import { GazePoint, ElementLock } from '@/types';

interface GazeOverlayProps {
  gazePoint: GazePoint | null;
  lockedElement: ElementLock | null;
}

export function GazeOverlay({ gazePoint, lockedElement }: GazeOverlayProps) {
  return (
    <>
      {/* Gaze cursor */}
      {gazePoint && (
        <div
          className="fixed pointer-events-none z-[9998] w-6 h-6 rounded-full border-2 border-primary bg-primary/20 transition-all duration-75"
          style={{
            left: `${gazePoint.x}px`,
            top: `${gazePoint.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}

      {/* Locked element highlight */}
      {lockedElement && (
        <div
          className="fixed pointer-events-none z-[9997] border-4 border-primary bg-primary/10 rounded transition-all duration-200"
          style={{
            left: `${lockedElement.bbox.x}px`,
            top: `${lockedElement.bbox.y}px`,
            width: `${lockedElement.bbox.w}px`,
            height: `${lockedElement.bbox.h}px`,
          }}
        >
          <div className="absolute -top-6 left-0 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
            {lockedElement.role}
          </div>
        </div>
      )}
    </>
  );
}
