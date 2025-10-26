/**
 * Gaze Suggestion Panel - The UI for displaying AI-powered suggestions
 * Appears when user dwells on a component
 */

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, Eye, Sparkles, X, Check, Pencil, ChevronRight } from 'lucide-react';

interface Suggestion {
  type: 'size' | 'color' | 'spacing' | 'text' | 'style';
  title: string;
  description: string;
  action: {
    property: string;
    value: string;
    oldValue: string;
  };
  priority: 'high' | 'medium' | 'low';
}

interface GazeSuggestionPanelProps {
  elementType: string;
  elementText: string;
  elementProperties: any;
  dwellTime: number;
  boundingRect: DOMRect;
  sectionId: string;
  onApplySuggestion: (suggestion: Suggestion) => void;
  onCustomEdit: (customText: string) => void;
  onDismiss: () => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export function GazeSuggestionPanel({
  elementType,
  elementText,
  elementProperties,
  dwellTime,
  boundingRect,
  sectionId,
  onApplySuggestion,
  onCustomEdit,
  onDismiss
}: GazeSuggestionPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customEditText, setCustomEditText] = useState('');
  const [showCustomEdit, setShowCustomEdit] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Fetch suggestions from backend
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setIsLoading(true);

        const response = await fetch(`${BACKEND_URL}/api/generate-suggestions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            elementType,
            elementText,
            elementProperties,
            context: {}, // Could include parent/sibling info
            dwellTime: dwellTime / 1000, // Convert to seconds
            sectionId
          })
        });

        if (!response.ok) {
          throw new Error('Failed to generate suggestions');
        }

        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        // Show fallback suggestions
        setSuggestions([
          {
            type: 'size',
            title: 'Make larger',
            description: 'Increase size for better visibility',
            action: { property: 'scale', value: '1.1', oldValue: '1' },
            priority: 'high'
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [elementType, elementText, elementProperties, dwellTime, sectionId]);

  const handleApplySuggestion = async (suggestion: Suggestion) => {
    setIsApplying(true);
    try {
      await onApplySuggestion(suggestion);
    } finally {
      setIsApplying(false);
    }
  };

  const handleCustomEdit = async () => {
    if (!customEditText.trim()) return;
    
    setIsApplying(true);
    try {
      await onCustomEdit(customEditText);
      setCustomEditText('');
      setShowCustomEdit(false);
    } finally {
      setIsApplying(false);
    }
  };

  // Position panel near the element (to the right or below)
  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(boundingRect.right + 20, window.innerWidth - 400),
    top: boundingRect.top,
    zIndex: 10001,
    maxWidth: '380px'
  };

  // If panel would go off-screen vertically, position it below the element
  if (boundingRect.top + 400 > window.innerHeight) {
    panelStyle.top = Math.max(20, boundingRect.bottom - 400);
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'size': return '📏';
      case 'color': return '🎨';
      case 'spacing': return '↔️';
      case 'text': return '📝';
      case 'style': return '✨';
      default: return '💡';
    }
  };

  return (
    <>
      {/* Highlight overlay on the element */}
      <div
        style={{
          position: 'fixed',
          left: boundingRect.left,
          top: boundingRect.top,
          width: boundingRect.width,
          height: boundingRect.height,
          border: '3px solid #3b82f6',
          borderRadius: '8px',
          pointerEvents: 'none',
          zIndex: 10000,
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
          animation: 'pulse 2s ease-in-out infinite'
        }}
      />

      {/* Suggestion Panel */}
      <Card
        className="bg-white shadow-2xl border-2 border-blue-400 overflow-hidden"
        style={panelStyle}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Eye className="w-5 h-5" />
            <span className="font-semibold">Gaze Detected</span>
            <Badge className="bg-white/20 text-white border-white/30">
              {(dwellTime / 1000).toFixed(1)}s
            </Badge>
          </div>
          <button
            onClick={onDismiss}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Element Info */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="text-xs text-slate-500 uppercase font-semibold mb-1">
            Looking at:
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800">
              {elementType}
            </Badge>
            {elementText && (
              <span className="text-sm text-slate-700 truncate max-w-[200px]">
                "{elementText}"
              </span>
            )}
          </div>
        </div>

        {/* Suggestions */}
        <div className="px-4 py-3 max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-slate-600">Generating suggestions...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-slate-700">
                  AI Suggestions
                </span>
              </div>

              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="border border-slate-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getTypeIcon(suggestion.type)}</span>
                      <span className="font-medium text-slate-800 text-sm">
                        {suggestion.title}
                      </span>
                    </div>
                    <Badge className={`text-xs ${getPriorityColor(suggestion.priority)}`}>
                      {suggestion.priority}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-slate-600 mb-3">
                    {suggestion.description}
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApplySuggestion(suggestion)}
                      disabled={isApplying}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isApplying ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        <Check className="w-3 h-3 mr-1" />
                      )}
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-slate-600"
                      onClick={onDismiss}
                    >
                      Skip
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-slate-500 text-sm">
              No suggestions available
            </div>
          )}
        </div>

        {/* Custom Edit Section */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
          {!showCustomEdit ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomEdit(true)}
              className="w-full flex items-center justify-center gap-2 text-slate-700 hover:text-blue-700 hover:border-blue-400"
            >
              <Pencil className="w-4 h-4" />
              Custom Edit
              <ChevronRight className="w-3 h-3" />
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-slate-500 uppercase font-semibold mb-2">
                Describe your change:
              </div>
              <Input
                type="text"
                placeholder="e.g., make it blue, larger font, add shadow..."
                value={customEditText}
                onChange={(e) => setCustomEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCustomEdit();
                  }
                }}
                className="text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCustomEdit}
                  disabled={!customEditText.trim() || isApplying}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isApplying ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Check className="w-3 h-3 mr-1" />
                  )}
                  Apply Custom
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowCustomEdit(false);
                    setCustomEditText('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </>
  );
}

