import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';

interface InstructionPanelProps {
  onSubmit: (instruction: string) => void;
  onClose: () => void;
  elementRole: string;
  lastResult?: string;
}

export function InstructionPanel({ onSubmit, onClose, elementRole, lastResult }: InstructionPanelProps) {
  const [instruction, setInstruction] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instruction.trim()) {
      onSubmit(instruction.trim());
      setInstruction('');
    }
  };

  const quickCommands = [
    'Make this red',
    'Make this blue',
    'Add rounded corners',
    'Increase padding by 8',
    'Make font size 20px',
  ];

  return (
    <Card className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-2xl p-4 shadow-lg border-2">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold">Change {elementRole}</h3>
          <p className="text-xs text-muted-foreground">Describe what you want to change</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {lastResult && (
        <div className="mb-3 p-2 bg-muted rounded text-sm">
          {lastResult}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
        <Input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder='e.g. "Make this button blue with rounded corners"'
          className="flex-1"
          autoFocus
        />
        <Button type="submit" disabled={!instruction.trim()}>
          Apply
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {quickCommands.map((cmd) => (
          <Button
            key={cmd}
            variant="outline"
            size="sm"
            onClick={() => onSubmit(cmd)}
          >
            {cmd}
          </Button>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
        <kbd className="px-1.5 py-0.5 bg-muted rounded">⌘</kbd> + 
        <kbd className="px-1.5 py-0.5 bg-muted rounded mx-1">⌥</kbd> + 
        <kbd className="px-1.5 py-0.5 bg-muted rounded">G</kbd> to lock element •
        <kbd className="px-1.5 py-0.5 bg-muted rounded ml-1">Esc</kbd> to close
      </div>
    </Card>
  );
}
