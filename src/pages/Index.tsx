import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calibration } from '@/components/Calibration';
import { GazeOverlay } from '@/components/GazeOverlay';
import { InstructionPanel } from '@/components/InstructionPanel';
import { useGazeTracker } from '@/hooks/useGazeTracker';
import { ElementLock } from '@/types';
import { parseInstruction } from '@/utils/nlpParser';
import { applyIntent, revertStyles, captureStyles } from '@/utils/styleApplier';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, RotateCcw } from 'lucide-react';

const Index = () => {
  const { toast } = useToast();
  const {
    isInitialized,
    isCalibrated,
    currentGaze,
    error,
    completeCalibration,
    pauseTracking,
    resumeTracking,
  } = useGazeTracker();

  const [showCalibration, setShowCalibration] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [lockedElement, setLockedElement] = useState<ElementLock | null>(null);
  const [showInstructionPanel, setShowInstructionPanel] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');
  const [history, setHistory] = useState<ElementLock[]>([]);

  // Start calibration when initialized
  useEffect(() => {
    if (isInitialized && !isCalibrated) {
      setShowCalibration(true);
    }
  }, [isInitialized, isCalibrated]);

  // Handle calibration complete
  const handleCalibrationComplete = () => {
    setShowCalibration(false);
    completeCalibration();
    toast({
      title: 'Calibration Complete',
      description: 'Gaze tracking is now active. Press ⌘+⌥+G to lock an element.',
    });
  };

  const handleSkipCalibration = () => {
    setShowCalibration(false);
    completeCalibration();
  };

  // Get element at gaze point
  const getElementAtGaze = useCallback((): HTMLElement | null => {
    if (!currentGaze) return null;
    
    const elements = document.elementsFromPoint(currentGaze.x, currentGaze.y);
    // Filter out overlay elements
    return elements.find(el => {
      const elem = el as HTMLElement;
      const zIndex = window.getComputedStyle(elem).zIndex;
      return zIndex !== '9999' && zIndex !== '9998' && zIndex !== '9997' && elem.tagName !== 'HTML' && elem.tagName !== 'BODY';
    }) as HTMLElement || null;
  }, [currentGaze]);

  // Lock element with Cmd+Alt+G
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+Alt+G (Mac) or Ctrl+Alt+G (Windows)
      if ((e.metaKey || e.ctrlKey) && e.altKey && e.key === 'g') {
        e.preventDefault();
        const element = getElementAtGaze();
        
        if (element) {
          const rect = element.getBoundingClientRect();
          const role = element.tagName.toLowerCase();
          const propsToCapture = [
            'backgroundColor', 'color', 'fontSize', 'padding', 'margin',
            'borderRadius', 'border', 'width', 'height'
          ];
          
          const lock: ElementLock = {
            id: `${role}-${Date.now()}`,
            role,
            bbox: {
              x: rect.left + window.scrollX,
              y: rect.top + window.scrollY,
              w: rect.width,
              h: rect.height,
            },
            element,
            originalStyles: captureStyles(element, propsToCapture),
          };
          
          setLockedElement(lock);
          setShowInstructionPanel(true);
          setLastResult('');
          toast({
            title: 'Element Locked',
            description: `Locked ${role}. Enter an instruction to modify it.`,
          });
        }
      }

      // Escape to close panel
      if (e.key === 'Escape' && showInstructionPanel) {
        setShowInstructionPanel(false);
        setLockedElement(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGaze, getElementAtGaze, showInstructionPanel, toast]);

  // Handle instruction submission
  const handleInstructionSubmit = (instruction: string) => {
    if (!lockedElement) return;

    const intent = parseInstruction(instruction);
    
    if (!intent) {
      setLastResult('❌ Could not understand instruction. Try: "Make this red" or "Add rounded corners"');
      return;
    }

    const result = applyIntent(lockedElement, intent);
    setLastResult(result.success ? `✅ ${result.message}` : `❌ ${result.message}`);
    
    if (result.success) {
      setHistory([...history, lockedElement]);
      toast({
        title: 'Change Applied',
        description: result.message,
      });
    }
  };

  // Undo last change
  const handleUndo = () => {
    if (history.length === 0) return;
    
    const lastLock = history[history.length - 1];
    revertStyles(lastLock);
    setHistory(history.slice(0, -1));
    toast({
      title: 'Change Reverted',
      description: 'Restored original styles',
    });
  };

  const togglePause = () => {
    if (isPaused) {
      resumeTracking();
    } else {
      pauseTracking();
    }
    setIsPaused(!isPaused);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-6 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-2 text-destructive">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm">Please ensure camera permissions are granted.</p>
        </Card>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing Clientsight...</p>
        </div>
      </div>
    );
  }

  if (showCalibration) {
    return (
      <Calibration
        onComplete={handleCalibrationComplete}
        onSkip={handleSkipCalibration}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Demo content */}
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome to Clientsight</h1>
          <p className="text-xl text-muted-foreground">
            AI-powered UI automation through gaze tracking
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-2">Get Started</h2>
            <p className="text-muted-foreground mb-4">
              Look at any element and press <kbd className="px-2 py-1 bg-muted rounded">⌘+⌥+G</kbd> to lock it.
            </p>
            <Button className="w-full">Try changing this button</Button>
          </Card>

          <Card className="p-6 bg-primary text-primary-foreground">
            <h2 className="text-2xl font-semibold mb-2">Example Commands</h2>
            <ul className="space-y-2 text-sm">
              <li>• "Make this blue"</li>
              <li>• "Add rounded corners"</li>
              <li>• "Change font size to 20px"</li>
              <li>• "Increase padding by 8"</li>
            </ul>
          </Card>
        </div>

        <div className="prose prose-sm max-w-none mb-8">
          <h3>How it works</h3>
          <p>
            Clientsight uses your webcam to track where you're looking on screen.
            When you lock an element, you can describe changes in natural language,
            and the system will apply them instantly with full preview and undo support.
          </p>
        </div>

        {/* Controls */}
        <Card className="p-4 flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={togglePause}
          >
            {isPaused ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {isPaused ? 'Resume' : 'Pause'} Tracking
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={history.length === 0}
          >
            <RotateCcw className="h-4 w-4" />
            Undo ({history.length})
          </Button>

          <div className="ml-auto text-sm text-muted-foreground">
            Status: {isCalibrated ? '🟢 Calibrated' : '🟡 Not calibrated'}
          </div>
        </Card>
      </div>

      {/* Overlays */}
      <GazeOverlay gazePoint={currentGaze} lockedElement={lockedElement} />
      
      {showInstructionPanel && lockedElement && (
        <InstructionPanel
          onSubmit={handleInstructionSubmit}
          onClose={() => {
            setShowInstructionPanel(false);
            setLockedElement(null);
          }}
          elementRole={lockedElement.role}
          lastResult={lastResult}
        />
      )}
    </div>
  );
};

export default Index;
