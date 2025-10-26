# 🔧 "Component is not defined" Fix

## 🐛 **The Problem**

Error: "Failed to Render - Component is not defined"

**Root Cause**: GPT-4 was generating Next.js code with framework-specific imports like:
```typescript
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
```

But we're rendering in a plain HTML iframe with CDN React, which:
- ❌ Doesn't support Next.js components
- ❌ Doesn't support ES6 imports
- ❌ Doesn't have a build step
- ✅ Only supports vanilla React via global `React` object

---

## ✅ **Fixes Applied**

### **1. Updated AI System Prompt** 
**File**: `backend/agents/component_generator_agent.py`

**Before** ❌:
```python
base_prompt = """Generate a React component using:
- TypeScript with proper type annotations
- Tailwind CSS for styling
...
```

**After** ✅:
```python
base_prompt = """Generate a React component using:
- VANILLA REACT ONLY (React 18 via CDN - no Next.js, no Vite, no framework-specific imports)
- Tailwind CSS for styling (via CDN)
...

CRITICAL RULES:
1. NO import statements - React is available globally as `React`
2. NO Next.js components (Image, Link, etc.) - use standard HTML elements
3. Use React.useState NOT import { useState }
4. Export as: export function ComponentName() { ... }
5. For images: use <img src="..."> NOT <Image>
6. For links: use <a href="..."> NOT <Link>

GOOD EXAMPLE:
export function HeroSection() {
  const [email, setEmail] = React.useState('');
  return (
    <section className="bg-gradient-to-r from-blue-500 to-purple-600">
      <img src="https://via.placeholder.com/400" alt="Hero" />
    </section>
  );
}

BAD EXAMPLE:
import { useState } from 'react'  ❌ NO IMPORTS
<Image src="..." />  ❌ Use <img> instead
```

### **2. Fixed Component Name Extraction**
**File**: `src/components/PageBuilderCanvas.tsx`

**Before** ❌:
```typescript
const nameMatch = componentCode.match(/(?:export\s+(?:default\s+)?(?:function|const)\s+)(\w+)/)
const componentName = nameMatch ? nameMatch[1] : 'Component'
```

**After** ✅:
```typescript
// Try multiple patterns
let componentName = 'Component'
let nameMatch = componentCode.match(/export\s+function\s+(\w+)/)
if (nameMatch) {
  componentName = nameMatch[1]
} else {
  nameMatch = componentCode.match(/export\s+const\s+(\w+)/)
  // ... more fallback patterns
}
```

### **3. Improved Code Cleanup**
**File**: `src/components/PageBuilderCanvas.tsx`

**Before** ❌:
```typescript
const cleanedCode = componentCode
  .replace(/^import\s+.*from.*$/gm, '')
  .replace(/^export\s+(default\s+)?/gm, '')
```

**After** ✅:
```typescript
const cleanedCode = componentCode
  .replace(/^import\s+.*from.*$/gm, '') // Remove all imports
  .replace(/^export\s+default\s+/gm, '') // Remove "export default "
  .replace(/^export\s+(?=function|const)/gm, '') // Remove "export " before function/const
  .trim()
```

### **4. Updated iframe Script**
**File**: `src/components/PageBuilderCanvas.tsx`

**Before** ❌:
```html
<script type="text/babel">
  const { useState, useEffect } = React; // Destructuring
  ${cleanedCode}
  root.render(<${componentName} />);
</script>
```

**After** ✅:
```html
<script type="text/babel" data-presets="react,typescript">
  // React hooks available as React.useState, React.useEffect, etc.
  // Components should use this format directly
  
  ${cleanedCode}
  
  root.render(
    <ErrorBoundary>
      <${componentName} />
    </ErrorBoundary>
  );
</script>
```

---

## 🚀 **How to Test the Fix**

### **Step 1: Restart Backend**
```bash
# Stop current backend (Ctrl+C)
cd backend
python main.py
```

Wait for: `🎉 All agents ready!`

### **Step 2: Hard Refresh Frontend**
- **Windows**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

### **Step 3: Clear Old Sections**
1. Open Page Builder (`Cmd/Ctrl + Alt + P`)
2. Hover over each existing section
3. Click 🗑️ to remove them

### **Step 4: Generate Fresh**
Type in prompt:
```
Create a modern landing page with hero section, features, and CTA
```

Click **✨ Generate Section**

### **Step 5: Check Console (F12)**
You should see:
```
🔨 Building HTML for: LandingPage
📝 Code length: XXXX chars
📄 First 200 chars: export function LandingPage() { const [email, setEmail] = React.useState(''); return ( <div className="min-h-screen"> <nav className="bg-white shadow-sm"> <div className="m
✅ Section LandingPage loaded
🚀 Rendering: LandingPage
✅ LandingPage rendered successfully
```

### **Step 6: Check Canvas**
You should now see the full landing page rendered!

---

## 📊 **What Changed**

### **Code Generation**

**Before** ❌:
```typescript
// GPT-4 was generating this:
import Image from 'next/image'
import { useState } from 'react'

export default function LandingPage() {
  const [email, setEmail] = useState('');
  return (
    <div>
      <Image src="/hero.jpg" width={500} height={500} />
    </div>
  );
}
```

**After** ✅:
```typescript
// GPT-4 now generates this:
export function LandingPage() {
  const [email, setEmail] = React.useState('');
  return (
    <div className="min-h-screen">
      <img 
        src="https://images.unsplash.com/photo-..." 
        alt="Hero" 
        className="w-full h-96 object-cover rounded-lg"
      />
    </div>
  );
}
```

### **Component Extraction**

**Before** ❌:
```
Component name extraction failed
→ Falls back to "Component"
→ Tries to render <Component />
→ "Component is not defined" error
```

**After** ✅:
```
Component name: "LandingPage" ✅
→ Renders <LandingPage />
→ Success! 🎉
```

---

## 🎯 **Why This Approach**

### **Why Not Use Next.js/Vite in iframe?**
❌ Would need:
- Full build environment
- Module bundler
- Transpilation pipeline
- Much more complex setup

✅ Current approach:
- Works immediately in browser
- No build step needed
- Perfect for hackathon demo
- Real-time rendering

### **Why Vanilla React?**
- ✅ Works with CDN React
- ✅ No dependencies
- ✅ Fast rendering
- ✅ Simple debugging
- ✅ Compatible with Tailwind CDN

### **Modern Design Still Possible?**
**YES!** ✅
- Tailwind CSS for modern styling
- Responsive layouts
- Gradients, shadows, animations
- All modern CSS features
- Just without framework-specific components

---

## 🎨 **What You CAN Still Use**

### ✅ **Allowed (Will Work)**
- React hooks: `React.useState`, `React.useEffect`, etc.
- Tailwind CSS classes
- HTML5 elements: `<img>`, `<video>`, `<a>`, etc.
- CSS animations and transitions
- Responsive design
- Modern layouts (Grid, Flexbox)
- Gradients, shadows, transforms
- SVG icons
- Placeholder images (Unsplash, Placeholder.com)

### ❌ **Not Allowed (Won't Work)**
- Next.js `<Image>` component
- Next.js `<Link>` component
- Next.js `useRouter` hook
- ES6 imports (`import X from 'Y'`)
- External npm packages
- TypeScript imports
- CSS module imports

---

## 🐛 **Troubleshooting**

### **Still seeing "Component is not defined"?**
1. Check console for component name extraction
2. Look for: `🔨 Building HTML for: [ComponentName]`
3. If it says "Component", the extraction failed
4. Share the "First 200 chars" log with me

### **Seeing Next.js imports in generated code?**
1. Backend might not have restarted
2. Restart backend: `cd backend && python main.py`
3. Wait for `🎉 All agents ready!`
4. Generate again

### **Seeing other errors?**
1. Check console (F12) for full error message
2. Look for error in iframe (right-click canvas → Inspect)
3. Share the error with me

---

## ✅ **Expected Result**

### **Visual Output:**
```
┌─────────────────────────────────────────┐
│ Page Builder                            │
├─────────────────────────────────────────┤
│                                         │
│  ╔═══════════════════════════════════╗  │
│  ║ 🌐 Modern Navigation Bar         ║  │
│  ╠═══════════════════════════════════╣  │
│  ║                                   ║  │
│  ║  🎨 Hero Section with Gradient   ║  │
│  ║     [Beautiful hero image]        ║  │
│  ║     [CTA Buttons]                ║  │
│  ║                                   ║  │
│  ╠═══════════════════════════════════╣  │
│  ║  ⚡ Features Grid                ║  │
│  ║  [Icon] [Icon] [Icon]            ║  │
│  ║                                   ║  │
│  ╠═══════════════════════════════════╣  │
│  ║  📢 Call-to-Action Section       ║  │
│  ║                                   ║  │
│  ╠═══════════════════════════════════╣  │
│  ║  📄 Footer                       ║  │
│  ╚═══════════════════════════════════╝  │
│                                         │
│  [LandingPage]                          │
└─────────────────────────────────────────┘
```

### **Console Output:**
```
🔨 Building HTML for: LandingPage
📝 Code length: 3254 chars
📄 First 200 chars: export function LandingPage() { const [isMenuOpen, setIsMenuOpen] = React.useState(false); const [email, setEmail] = React.useState(''); return ( <div className="min-h-screen bg-gray-50">
✅ Section LandingPage loaded
🚀 Rendering: LandingPage
cdn.tailwindcss.com should not be used in production... (warning - ignore)
✅ LandingPage rendered successfully
```

---

## 📝 **Files Modified**

1. **`backend/agents/component_generator_agent.py`**
   - Updated `build_system_prompt()` function
   - Added explicit rules for vanilla React
   - Added examples of correct/incorrect code
   - Emphasized NO imports, NO Next.js components

2. **`src/components/PageBuilderCanvas.tsx`**
   - Enhanced component name extraction (multiple patterns)
   - Improved code cleanup regex
   - Removed React destructuring from iframe script
   - Added debug logging for troubleshooting

---

## 🎉 **Summary**

**Problem**: Next.js code in vanilla React environment  
**Solution**: Generate vanilla React code only  

**Before**: Framework-specific imports → Component not defined ❌  
**After**: Pure React with global hooks → Renders successfully ✅  

**Design Quality**: No compromise! Modern Tailwind styling still works perfectly.

---

**Status**: ✅ Ready to test  
**Action**: Restart backend + hard refresh + generate fresh section  
**Expected**: Beautiful modern landing page renders successfully!

