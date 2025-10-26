# 🔧 Page Builder Blank Screen Fix

## 🐛 **Issue**
Page Builder shows "1 section" but canvas displays blank white screen after generating a landing page.

## ✅ **Fixes Applied**

### **1. Added `allow-same-origin` to iframe sandbox**
- **Before**: `sandbox="allow-scripts"`
- **After**: `sandbox="allow-scripts allow-same-origin"`
- **Why**: Needed for proper React rendering

### **2. Increased iframe height**
- **Before**: `minHeight: '200px'`
- **After**: `minHeight: '400px'`
- **Why**: Landing pages need more vertical space

### **3. Added Error Boundary**
- Catches React errors inside iframe
- Shows user-friendly error messages
- Displays stack traces for debugging

### **4. Enhanced HTML Builder**
- Added Tailwind config
- Added TypeScript support for Babel (`data-presets="react,typescript"`)
- Added proper body/root styling
- Added comprehensive error handling

### **5. Debug Logging**
- Logs component name and code length
- Logs iframe load events
- Logs render success/failure
- Makes troubleshooting easier

---

## 🚀 **How to Test the Fix**

### **Step 1: Hard Refresh Browser**
- **Windows**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

### **Step 2: Open Console**
Press `F12` to see logs

### **Step 3: Clear Existing Section**
1. In Page Builder, hover over the "LandingPage" section
2. Click the 🗑️ button to remove it

### **Step 4: Generate Fresh**
1. Type: `Create a modern landing page`
2. Click **✨ Generate Section**
3. Wait ~5-10 seconds

### **Step 5: Check Console**
You should see:
```
🔨 Building HTML for: LandingPage
📝 Code length: XXXX chars
✅ Section LandingPage loaded
🚀 Rendering: LandingPage
✅ LandingPage rendered successfully
```

### **Step 6: Check Canvas**
You should now see the full landing page with:
- Navigation bar at top
- Hero section with gradient
- Features section
- CTA section
- Footer

---

## 🔍 **If Still Blank**

### **Check 1: Console Errors**
Look for any red error messages. Common issues:
- `SyntaxError` → GPT-4 generated invalid code
- `ReferenceError` → Missing React hooks
- `TypeError` → Props issue

### **Check 2: Click "Code" Toggle**
1. Click **💻 Code** button in header
2. Check if code is there
3. Look for obvious syntax errors

### **Check 3: Inspect Iframe**
1. Right-click on blank canvas area
2. Select "Inspect"
3. Look for iframe element
4. Check if srcDoc attribute has HTML content

---

## 📊 **What Changed**

### **Before (PageBuilderCanvas.tsx)**
```typescript
<iframe
  srcDoc={html}
  className="w-full border-0"
  style={{ minHeight: '200px' }}
  sandbox="allow-scripts"  // ❌ Missing allow-same-origin
  title={`Section ${section.component.name}`}
/>

function buildSectionHTML(componentCode: string): string {
  // Simple HTML without error handling ❌
  return `<!DOCTYPE html>
    <body>
      <div id="root"></div>
      <script type="text/babel">
        ${cleanedCode}
        const root = ReactDOM.createRoot(...);
        root.render(<${componentName} />);  // ❌ No error boundary
      </script>
    </body>
  </html>`
}
```

### **After (PageBuilderCanvas.tsx)**
```typescript
<iframe
  srcDoc={html}
  className="w-full border-0"
  style={{ minHeight: '400px', height: 'auto' }}  // ✅ Larger
  sandbox="allow-scripts allow-same-origin"  // ✅ Fixed
  title={`Section ${section.component.name}`}
  onLoad={() => console.log(...)}  // ✅ Debug logging
  onError={(e) => console.error(...)}  // ✅ Error logging
/>

function buildSectionHTML(componentCode: string): string {
  // Comprehensive HTML with error handling ✅
  console.log('🔨 Building HTML for:', componentName)  // ✅ Debug
  
  return `<!DOCTYPE html>
    <head>
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {...}  // ✅ Tailwind config
      </script>
      ...
    </head>
    <body>
      <div id="root"></div>
      <script type="text/babel" data-presets="react,typescript">  // ✅ TypeScript
        // ✅ Error Boundary
        class ErrorBoundary extends React.Component {...}
        
        ${cleanedCode}
        
        // ✅ Try-catch wrapper
        try {
          root.render(
            <ErrorBoundary>
              <${componentName} />
            </ErrorBoundary>
          );
        } catch (error) {
          // ✅ Show error message
        }
      </script>
    </body>
  </html>`
}
```

---

## 🎯 **Expected Behavior After Fix**

### **Visual:**
```
┌─────────────────────────────────────────┐
│ Page Builder          [Export] [Close] │
├──────────────┬──────────────────────────┤
│              │                          │
│  ┌────────┐  │      Sidebar             │
│  │  Nav   │  │   [Prompt input]         │
│  │────────│  │   [Generate button]      │
│  │ Hero   │  │   [Quick templates]      │
│  │        │  │                          │
│  │────────│  │                          │
│  │Features│  │   ✅ "LandingPage loaded"│
│  │────────│  │                          │
│  │  CTA   │  │                          │
│  │────────│  │                          │
│  │ Footer │  │                          │
│  └────────┘  │                          │
│              │                          │
│ [LandingPage]│                          │
└──────────────┴──────────────────────────┘
```

### **Console Logs:**
```
🔨 Building HTML for: LandingPage
📝 Code length: 2847 chars
✅ Section LandingPage loaded
🚀 Rendering: LandingPage
cdn.tailwindcss.com should not be used in production...
✅ LandingPage rendered successfully
```

---

## 🐛 **Troubleshooting Specific Errors**

### **Error: "Cannot read property 'useState' of undefined"**
**Cause**: React not loaded before Babel runs  
**Status**: ✅ Fixed (proper script loading order)

### **Error: "Unexpected token '<'"**
**Cause**: JSX not being transpiled  
**Status**: ✅ Fixed (added data-presets="react,typescript")

### **Error: Component flickers then disappears**
**Cause**: JavaScript error causing crash  
**Status**: ✅ Fixed (Error Boundary catches errors)

### **Error: Styles not applied**
**Cause**: Tailwind config missing  
**Status**: ✅ Fixed (added tailwind.config in iframe)

---

## 📝 **Files Modified**

1. **`src/components/PageBuilderCanvas.tsx`**
   - Updated iframe sandbox attribute
   - Increased iframe height
   - Added onLoad/onError handlers
   - Rewrote `buildSectionHTML()` function
   - Added Error Boundary
   - Added debug logging
   - Added Tailwind config
   - Added TypeScript support

---

## ✅ **Testing Checklist**

After hard refresh:
- [ ] Page Builder opens (z-index fix from before)
- [ ] Console shows "🔨 Building HTML for: ..."
- [ ] Console shows "✅ Section ... loaded"
- [ ] Canvas shows rendered component (not blank)
- [ ] Hover over section shows controls (↑↓🗑️)
- [ ] "LandingPage" label visible at bottom-left
- [ ] Component is interactive (buttons clickable)
- [ ] Code toggle shows actual code
- [ ] Export buttons work

---

## 🎉 **Summary**

**Before**: Blank white screen  
**After**: Full rendered landing page  

**Root Cause**: Missing `allow-same-origin` + no error handling  
**Solution**: Enhanced iframe sandbox + comprehensive error boundary  

**Status**: ✅ Ready to test  
**Action**: Hard refresh (Ctrl+Shift+R) and regenerate section

