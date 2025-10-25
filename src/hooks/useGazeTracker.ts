import { useState, useEffect, useCallback } from 'react';
import { GazePoint } from '@/types';

declare global {
  interface Window {
    webgazer: any;
  }
}

export function useGazeTracker() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [currentGaze, setCurrentGaze] = useState<GazePoint | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initWebGazer = async () => {
      try {
        // Load webgazer dynamically
        const script = document.createElement('script');
        script.src = 'https://webgazer.cs.brown.edu/webgazer.js';
        script.async = true;
        
        script.onload = () => {
          if (!mounted || !window.webgazer) return;

          window.webgazer
            .setGazeListener((data: any) => {
              if (data && mounted) {
                setCurrentGaze({
                  x: data.x,
                  y: data.y,
                  timestamp: Date.now(),
                });
              }
            })
            .saveDataAcrossSessions(false)
            .showVideoPreview(false)
            .showPredictionPoints(false)
            .begin();

          setIsInitialized(true);
        };

        script.onerror = () => {
          setError('Failed to load WebGazer library');
        };

        document.head.appendChild(script);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      }
    };

    initWebGazer();

    return () => {
      mounted = false;
      if (window.webgazer) {
        window.webgazer.end();
      }
    };
  }, []);

  const startCalibration = useCallback(() => {
    setIsCalibrated(false);
  }, []);

  const completeCalibration = useCallback(() => {
    setIsCalibrated(true);
  }, []);

  const pauseTracking = useCallback(() => {
    if (window.webgazer) {
      window.webgazer.pause();
    }
  }, []);

  const resumeTracking = useCallback(() => {
    if (window.webgazer) {
      window.webgazer.resume();
    }
  }, []);

  return {
    isInitialized,
    isCalibrated,
    currentGaze,
    error,
    startCalibration,
    completeCalibration,
    pauseTracking,
    resumeTracking,
  };
}
