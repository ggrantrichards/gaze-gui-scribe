import { Intent } from '@/types';

/**
 * Parse natural language instructions into structured CSS updates
 */
export function parseInstruction(text: string): Intent | null {
  const normalized = text.toLowerCase().trim();
  
  // Style update patterns
  const colorPatterns = [
    { regex: /(?:make|change|set).*(?:color|background).*?(#[0-9a-f]{3,6}|rgb\([^)]+\)|[a-z]+)/i, prop: 'backgroundColor' },
    { regex: /(?:make|change|set).*?(?:to\s+)?(?:color\s+)?(red|blue|green|yellow|purple|orange|pink|black|white|gray)/i, prop: 'backgroundColor' },
  ];
  
  const sizePatterns = [
    { regex: /(?:make|set).*?(?:font|text).*?(\d+)(?:px|pt)/i, prop: 'fontSize', unit: 'px' },
    { regex: /(?:make|set).*?(?:width).*?(\d+)(?:px|%)/i, prop: 'width', unit: 'px' },
    { regex: /(?:make|set).*?(?:height).*?(\d+)(?:px|%)/i, prop: 'height', unit: 'px' },
  ];
  
  const borderPatterns = [
    { regex: /(?:add|make|set).*?(?:rounded|border-radius).*?(\d+)(?:px)?/i, prop: 'borderRadius', unit: 'px' },
    { regex: /(?:add|make|set).*?(?:border).*?(\d+)(?:px)?/i, prop: 'border', template: (val: string) => `${val}px solid currentColor` },
  ];
  
  const paddingPatterns = [
    { regex: /(?:increase|add|set).*?(?:padding).*?(\d+)(?:px)?/i, prop: 'padding', unit: 'px' },
  ];

  const textPatterns = [
    { regex: /(?:change|set|replace).*?(?:text|label).*?(?:to|with)\s+['""]([^'"]+)['""]?/i },
    { regex: /(?:change|set|replace).*?(?:text|label).*?(?:to|with)\s+(.+)$/i },
  ];

  const targetProps: Record<string, string | number> = {};

  // Check text replacement first
  for (const pattern of textPatterns) {
    const match = normalized.match(pattern.regex);
    if (match) {
      return {
        action: 'text.replace',
        targetProps: { text: match[1].trim() },
      };
    }
  }

  // Check color patterns
  for (const pattern of colorPatterns) {
    const match = normalized.match(pattern.regex);
    if (match) {
      let color = match[1];
      // Convert color names to hex
      const colorMap: Record<string, string> = {
        red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308',
        purple: '#a855f7', orange: '#f97316', pink: '#ec4899', black: '#000000',
        white: '#ffffff', gray: '#6b7280',
      };
      color = colorMap[color.toLowerCase()] || color;
      targetProps[pattern.prop] = color;
    }
  }

  // Check size patterns
  for (const pattern of sizePatterns) {
    const match = normalized.match(pattern.regex);
    if (match) {
      targetProps[pattern.prop] = `${match[1]}${pattern.unit}`;
    }
  }

  // Check border patterns
  for (const pattern of borderPatterns) {
    const match = normalized.match(pattern.regex);
    if (match) {
      if (pattern.template) {
        targetProps[pattern.prop] = pattern.template(match[1]);
      } else {
        targetProps[pattern.prop] = `${match[1]}${pattern.unit}`;
      }
    }
  }

  // Check padding patterns
  for (const pattern of paddingPatterns) {
    const match = normalized.match(pattern.regex);
    if (match) {
      targetProps[pattern.prop] = `${match[1]}${pattern.unit}`;
    }
  }

  if (Object.keys(targetProps).length > 0) {
    return {
      action: 'style.update',
      targetProps,
    };
  }

  return null;
}
