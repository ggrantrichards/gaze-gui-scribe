import { useState, useEffect } from 'react';
import { CalibrationPoint } from '@/types';
import { Button } from '@/components/ui/button';

interface CalibrationProps {
  onComplete: () => void;
  onSkip: () => void;
}

const CALIBRATION_POINTS: CalibrationPoint[] = [
  { x: 10, y: 10, index: 0 },   // Top-left
  { x: 90, y: 10, index: 1 },   // Top-right
  { x: 50, y: 50, index: 2 },   // Center
  { x: 10, y: 90, index: 3 },   // Bottom-left
  { x: 90, y: 90, index: 4 },   // Bottom-right
];

export function Calibration({ onComplete, onSkip }: CalibrationProps) {
  const [currentPoint, setCurrentPoint] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const CLICKS_PER_POINT = 5;

  useEffect(() => {
    if (clickCount >= CLICKS_PER_POINT) {
      if (currentPoint >= CALIBRATION_POINTS.length - 1) {
        setTimeout(onComplete, 500);
      } else {
        setCurrentPoint(currentPoint + 1);
        setClickCount(0);
      }
    }
  }, [clickCount, currentPoint, onComplete]);

  const handlePointClick = () => {
    setClickCount(clickCount + 1);
  };

  const point = CALIBRATION_POINTS[currentPoint];

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Calibration</h1>
          <p className="text-muted-foreground mb-4">
            Click the red circle {CLICKS_PER_POINT} times while looking at it
          </p>
          <p className="text-sm text-muted-foreground">
            Point {currentPoint + 1} of {CALIBRATION_POINTS.length} • 
            Click {clickCount}/{CLICKS_PER_POINT}
          </p>
          <Button variant="ghost" onClick={onSkip} className="mt-4">
            Skip Calibration
          </Button>
        </div>
      </div>

      <button
        onClick={handlePointClick}
        className="fixed w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 animate-pulse cursor-pointer border-4 border-white shadow-lg transition-all"
        style={{
          left: `${point.x}%`,
          top: `${point.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
        aria-label={`Calibration point ${currentPoint + 1}`}
      />
    </div>
  );
}
