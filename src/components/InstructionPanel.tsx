import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Sparkles } from 'lucide-react'

export function InstructionPanel({
  onSubmit, onClose, elementRole, lastResult, seedText
}: {
  onSubmit: (instruction: string) => void
  onClose: () => void
  elementRole: string
  lastResult: string
  seedText?: string
}) {
  const [value, setValue] = useState(seedText || 'Make this blue')

  useEffect(() => {
    if (seedText) setValue(seedText)
  }, [seedText])

  return (
    <div className="fixed right-6 bottom-6 z-[9998] animate-in slide-in-from-right-4 duration-300">
      <Card className="w-[380px] shadow-2xl border-primary-100 bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-600" />
              Modify {elementRole}
            </CardTitle>
            <CardDescription className="text-[10px] mt-1">AI-Powered Natural Language Editor</CardDescription>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="e.g., Make this red / Add rounded corners"
            className="bg-slate-50 border-slate-200 focus:ring-primary-500"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSubmit(value)
            }}
          />
          <div className="flex gap-2">
            <Button className="flex-1 bg-primary-600 hover:bg-primary-700" onClick={() => onSubmit(value)}>
              Apply Changes
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
          {lastResult && (
            <div className={`text-xs p-2 rounded ${
              lastResult.includes('✅') 
                ? 'bg-green-50 text-green-700 border border-green-100' 
                : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {lastResult}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
