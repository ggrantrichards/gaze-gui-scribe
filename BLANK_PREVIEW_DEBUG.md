# 🔍 Blank Preview Debugging Guide

## Problem: White Screen in Preview

You're seeing a blank white screen instead of your component. Here's how to debug and fix it:

---

## 🎯 Quick Debug Steps

### Step 1: Open Browser Console
```
Windows/Linux: Press F12 or Ctrl+Shift+I
Mac: Press Cmd+Option+I
```

### Step 2: Look for These Messages

**✅ Good (Working):**
```
🔍 Preview HTML generated
📝 Component code: export function LoginForm()...
🚀 Attempting to render component: LoginForm
✅ Component rendered successfully
```

**❌ Bad (Error):**
```
❌ Component render error: [error message]
❌ Iframe error: [error message]
```

---

## 🚨 Common Causes & Fixes

### Cause 1: Shadcn Components Not Available

**Problem:**
You asked for "shadcn components" but they're not loaded in the preview iframe.

**What you'll see in console:**
```
ReferenceError: Button is not defined
ReferenceError: Card is not defined
```

**Fix:**
Use plain React + Tailwind instead:

```typescript
// ❌ Won't work (shadcn not loaded)
import { Button } from '@/components/ui/button'
<Button>Click me</Button>

// ✅ Will work (plain React + Tailwind)
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  Click me
</button>
```

---

### Cause 2: Component Name Mismatch

**Problem:**
The component function name doesn't match what's expected.

**What you'll see:**
```
ReferenceError: LoginForm is not defined
```

**Fix:**
Make sure the component is actually defined:

```typescript
// ✅ Correct
export function LoginForm() {
  return <div>...</div>
}

// ❌ Wrong (no function)
const form = <div>...</div>
```

---

### Cause 3: Missing React Hooks

**Problem:**
Hooks aren't properly imported in the iframe context.

**What you'll see:**
```
ReferenceError: useState is not defined
```

**Fix:**
The preview automatically provides hooks, but make sure they're destructured:

```typescript
// ✅ Correct (hooks available from React)
function LoginForm() {
  const [email, setEmail] = React.useState('')
  // OR
  const { useState } = React
  const [email, setEmail] = useState('')
}
```

---

### Cause 4: Invalid JSX Syntax

**Problem:**
JSX has syntax errors.

**What you'll see:**
```
SyntaxError: Unexpected token
```

**Fix:**
Check for:
- Unclosed tags
- Missing commas
- Incorrect attribute syntax

---

## 🛠️ How to Debug in Real-Time

### Step 1: Generate Component
```bash
npm run dev
# Press Cmd/Ctrl + Alt + C
# Type: "Create a simple button"
# Click Generate
```

### Step 2: Check Console Immediately
Look for the debug messages:
```
🔍 Preview HTML generated
📝 Component code: ...
```

### Step 3: Click "Log to Console" Button
In the error message, click the "Log to Console" button to see the full code.

### Step 4: Check Code View
Look at the right panel - does the code look correct?

---

## 💡 Testing with Simple Components

### Test 1: Minimal Button (Should Always Work)
```
Prompt: "Create a simple button"

Expected Output:
export function Button() {
  return (
    <button className="px-4 py-2 bg-blue-600 text-white rounded">
      Click Me
    </button>
  )
}
```

### Test 2: Basic Form (Should Work)
```
Prompt: "Create a basic login form"

Expected Output:
function LoginForm() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  
  return (
    <form className="max-w-md mx-auto p-6">
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Login</button>
    </form>
  )
}
```

---

## 🎨 About Shadcn & Animations

### The Issue
Shadcn components aren't available in the preview because they require:
- Installation via npm
- Component files in your project
- Build-time configuration

### What's Available Instead
The preview includes:
- ✅ React 18 (all hooks)
- ✅ Tailwind CSS v3 (all utilities including animations)
- ✅ Plain HTML/JSX components

### Use Tailwind Animations Instead

**Instead of shadcn animations:**
```tsx
// ❌ Won't work
import { Button } from '@/components/ui/button'
<Button variant="animated">Click</Button>
```

**Use Tailwind animations:**
```tsx
// ✅ Will work
<button className="px-4 py-2 bg-blue-600 text-white rounded
                   transition-all duration-300 
                   hover:scale-105 hover:shadow-lg
                   active:scale-95">
  Click Me
</button>
```

**Available Tailwind Animations:**
```css
/* Transitions */
transition-all duration-300
hover:scale-105
hover:rotate-6
hover:translate-y-1

/* Transforms */
transform scale-110
rotate-45
skew-x-12

/* Animations */
animate-spin
animate-pulse
animate-bounce
```

---

## 🔧 Manual Debug Process

### 1. Generate and Capture Error
```bash
1. Generate component
2. See blank screen
3. Open console (F12)
4. Look for error messages
```

### 2. Check Generated Code
```bash
1. Click "Log to Console" button in error dialog
2. Copy the code
3. Check for:
   - Valid JSX syntax
   - Proper function definition
   - No shadcn imports
   - Hooks used correctly
```

### 3. Fix Common Issues
```typescript
// If code has this:
import { useState } from 'react' ❌

// Remove it (React is global in iframe)
// And use:
const [state, setState] = React.useState() ✅
```

---

## 🎯 For Your Specific Case: "Modern Login Form"

### What Should Work
```typescript
export function LoginForm() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Login:', { email, password })
  }

  return (
    <form 
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-8 bg-white rounded-xl shadow-2xl"
    >
      <h2 className="text-3xl font-bold mb-8 text-gray-900">Login</h2>
      
      {/* Email Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-all duration-200"
          placeholder="you@example.com"
          required
        />
      </div>

      {/* Password Input */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-all duration-200"
          placeholder="••••••••"
          required
        />
      </div>

      {/* Submit Button with Animation */}
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white 
                   font-semibold py-3 rounded-lg
                   transition-all duration-300
                   transform hover:scale-105 hover:shadow-xl
                   active:scale-95"
      >
        Sign In
      </button>
    </form>
  )
}
```

**This includes:**
- ✅ React hooks (useState)
- ✅ Tailwind CSS styling
- ✅ Animations (transition, scale, shadow)
- ✅ No shadcn dependencies
- ✅ Will render perfectly

---

## 📊 Debugging Checklist

When you see blank preview:

- [ ] Open browser console (F12)
- [ ] Check for error messages
- [ ] Look for "Component render error"
- [ ] Click "Log to Console" button
- [ ] Verify no shadcn imports
- [ ] Verify component function exists
- [ ] Check JSX syntax is valid
- [ ] Try a simpler component (button)
- [ ] Check if CDN resources loaded (React, Tailwind)

---

## 🚀 Next Steps

### If Still Blank After Debug:

1. **Try Quick Generate "Button"**
   - Should always work
   - If this works, problem is with generated code

2. **Check Console for Specific Error**
   - Note the exact error message
   - Search for it in the guide above

3. **Use "Log to Console" Button**
   - See the full generated code
   - Check for obvious issues

4. **Test with Mock Component**
   - Close preview
   - Try "Form" quick generate
   - Check if mock components work

---

## 💡 Pro Tips

### Tip 1: Always Check Console First
The console will tell you exactly what's wrong.

### Tip 2: Test Simple Components
If a button works but a form doesn't, the problem is in the form code.

### Tip 3: Avoid Complex Prompts
Instead of: "Create a modern login form with shadcn and animations"
Try: "Create a simple login form"
Then add styling manually.

### Tip 4: Use Tailwind Animations
Tailwind has built-in animations that work great:
- `hover:scale-105`
- `transition-all duration-300`
- `hover:shadow-xl`

---

## ✅ Summary

**Blank Screen = JavaScript Error in Iframe**

**Most Common Cause:** Trying to use shadcn components that aren't loaded

**Fix:** Use plain React + Tailwind with Tailwind's built-in animations

**Debug Process:**
1. Open console (F12)
2. Look for error messages  
3. Click "Log to Console"
4. Check for shadcn imports or syntax errors
5. Try simpler prompt

**Test with:** "Create a simple button" (should always work)

---

**Need More Help?**
- Check the console error message
- Click "Log to Console" in the error dialog
- Try generating a simple button first
- Look for the specific error in this guide


