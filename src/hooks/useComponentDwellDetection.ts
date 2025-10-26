/**
 * Hook for detecting when user gazes at a specific component for extended time
 * This is the CORE feature - detecting dwell to trigger suggestions
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { GazePoint } from '../types';

interface DwellTarget {
  element: HTMLElement;
  elementId: string;
  startTime: number;
  dwellTime: number;
  lastGazeTime: number;
}

interface DwellDetectionOptions {
  /** Minimum dwell time to trigger suggestion (milliseconds) */
  dwellThreshold?: number;
  /** Maximum distance from element to count as "looking at it" (pixels) */
  proximityThreshold?: number;
  /** Time to wait after last gaze before resetting dwell (milliseconds) */
  gazeTimeout?: number;
}

interface DwellEvent {
  element: HTMLElement;
  elementId: string;
  dwellTime: number;
  elementType: string;
  elementText: string;
  elementProperties: any;
  boundingRect: DOMRect;
}

export function useComponentDwellDetection(
  currentGaze: GazePoint | null,
  containerRef: React.RefObject<HTMLElement>,
  options: DwellDetectionOptions = {}
) {
  const {
    dwellThreshold = 2000, // 2 seconds default
    proximityThreshold = 50, // 50px radius
    gazeTimeout = 500 // 0.5s to break gaze
  } = options;

  const [activeDwell, setActiveDwell] = useState<DwellEvent | null>(null);
  const dwellTargetRef = useRef<DwellTarget | null>(null);
  const checkIntervalRef = useRef<number>();

  /**
   * Get element at gaze coordinates, accounting for iframes
   */
  const getElementAtGaze = useCallback((x: number, y: number): HTMLElement | null => {
    if (!containerRef.current) return null;

    // Check if gaze is inside an iframe
    const iframes = containerRef.current.querySelectorAll('iframe');
    
    for (const iframe of Array.from(iframes)) {
      const iframeRect = iframe.getBoundingClientRect();
      
      // Check if gaze is within iframe bounds
      if (
        x >= iframeRect.left &&
        x <= iframeRect.right &&
        y >= iframeRect.top &&
        y <= iframeRect.bottom
      ) {
        try {
          // Try to access iframe content (same-origin only)
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            // Convert coordinates to iframe space
            const iframeX = x - iframeRect.left;
            const iframeY = y - iframeRect.top + (iframe.contentWindow?.scrollY || 0);
            
            const element = iframeDoc.elementFromPoint(iframeX, iframeY);
            if (element && element instanceof HTMLElement) {
              // Attach reference to parent iframe for later use
              (element as any)._parentIframe = iframe;
              return element;
            }
          }
        } catch (e) {
          // Cross-origin iframe, skip
          console.warn('Cannot access iframe content (cross-origin)');
        }
      }
    }

    // Check main document
    const element = document.elementFromPoint(x, y);
    return element instanceof HTMLElement ? element : null;
  }, [containerRef]);

  /**
   * Check if element is interactive (worth suggesting improvements for)
   */
  const isInteractiveElement = useCallback((element: HTMLElement): boolean => {
    const tagName = element.tagName.toLowerCase();
    const interactiveTags = ['button', 'a', 'input', 'textarea', 'select', 'img', 'h1', 'h2', 'h3', 'p'];
    
    if (interactiveTags.includes(tagName)) return true;
    
    // Check if has click handler or is clickable
    const hasClickHandler = element.onclick !== null || 
                           element.getAttribute('onclick') !== null;
    const isClickable = element.style.cursor === 'pointer';
    
    return hasClickHandler || isClickable;
  }, []);

  /**
   * Extract element properties for AI analysis
   */
  const extractElementProperties = useCallback((element: HTMLElement) => {
    const computed = window.getComputedStyle(element);
    
    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id,
      className: element.className,
      textContent: element.textContent?.trim() || '',
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      padding: computed.padding,
      margin: computed.margin,
      width: computed.width,
      height: computed.height,
      display: computed.display,
      borderRadius: computed.borderRadius
    };
  }, []);

  /**
   * Get element context (parent and siblings) for better AI suggestions
   */
  const getElementContext = useCallback((element: HTMLElement) => {
    const parent = element.parentElement;
    const siblings = parent ? Array.from(parent.children) : [];
    
    return {
      parent: parent?.tagName.toLowerCase(),
      parentClasses: parent?.className,
      siblingCount: siblings.length,
      position: siblings.indexOf(element),
      hasChildren: element.children.length > 0
    };
  }, []);

  /**
   * Check and update dwell state
   */
  const checkDwell = useCallback(() => {
    if (!currentGaze || !containerRef.current) {
      // No gaze, check if we should timeout existing dwell
      if (dwellTargetRef.current) {
        const timeSinceLastGaze = Date.now() - dwellTargetRef.current.lastGazeTime;
        if (timeSinceLastGaze > gazeTimeout) {
          // Reset dwell
          dwellTargetRef.current = null;
          setActiveDwell(null);
        }
      }
      return;
    }

    const element = getElementAtGaze(currentGaze.x, currentGaze.y);
    
    if (!element || !isInteractiveElement(element)) {
      // Not looking at interactive element, check timeout
      if (dwellTargetRef.current) {
        const timeSinceLastGaze = Date.now() - dwellTargetRef.current.lastGazeTime;
        if (timeSinceLastGaze > gazeTimeout) {
          dwellTargetRef.current = null;
          setActiveDwell(null);
        }
      }
      return;
    }

    // Generate unique ID for element
    const elementId = `${element.tagName}-${element.id || ''}-${element.className || ''}-${Date.now()}`;

    const now = Date.now();

    // Check if this is same element as current dwell target
    if (
      dwellTargetRef.current &&
      dwellTargetRef.current.element === element
    ) {
      // Update dwell time
      dwellTargetRef.current.dwellTime = now - dwellTargetRef.current.startTime;
      dwellTargetRef.current.lastGazeTime = now;

      // Check if dwell threshold reached
      if (
        dwellTargetRef.current.dwellTime >= dwellThreshold &&
        !activeDwell
      ) {
        // Trigger dwell event!
        const properties = extractElementProperties(element);
        const context = getElementContext(element);
        
        // Get bounding rect (accounting for iframe)
        let boundingRect = element.getBoundingClientRect();
        const parentIframe = (element as any)._parentIframe;
        if (parentIframe) {
          const iframeRect = parentIframe.getBoundingClientRect();
          boundingRect = new DOMRect(
            boundingRect.left + iframeRect.left,
            boundingRect.top + iframeRect.top,
            boundingRect.width,
            boundingRect.height
          );
        }

        const dwellEvent: DwellEvent = {
          element,
          elementId: dwellTargetRef.current.elementId,
          dwellTime: dwellTargetRef.current.dwellTime,
          elementType: element.tagName.toLowerCase(),
          elementText: element.textContent?.trim() || '',
          elementProperties: properties,
          boundingRect
        };

        console.log('🎯 DWELL DETECTED:', dwellEvent.elementType, dwellEvent.dwellTime + 'ms');
        setActiveDwell(dwellEvent);
      }
    } else {
      // New element, start new dwell tracking
      dwellTargetRef.current = {
        element,
        elementId,
        startTime: now,
        dwellTime: 0,
        lastGazeTime: now
      };
      
      // Reset active dwell
      setActiveDwell(null);
    }
  }, [
    currentGaze,
    containerRef,
    dwellThreshold,
    gazeTimeout,
    activeDwell,
    getElementAtGaze,
    isInteractiveElement,
    extractElementProperties,
    getElementContext
  ]);

  /**
   * Manually dismiss active dwell
   */
  const dismissDwell = useCallback(() => {
    dwellTargetRef.current = null;
    setActiveDwell(null);
  }, []);

  // Set up interval to check dwell
  useEffect(() => {
    checkIntervalRef.current = window.setInterval(checkDwell, 100); // Check every 100ms

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkDwell]);

  return {
    activeDwell,
    dismissDwell,
    isDwelling: dwellTargetRef.current !== null
  };
}

