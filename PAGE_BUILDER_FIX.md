# 🔧 Page Builder Z-Index Fix

## 🐛 **Issue**
Page Builder appeared for half a second then disappeared, only camera window visible.

## ✅ **Root Cause**
- **Gaze Overlay**: `z-index: 9999`
- **Page Builder (before)**: `z-index: 50`
- **Result**: Camera window covered Page Builder!

## ✅ **Fix Applied**
- **Page Builder (after)**: `z-index: 10000`
- Now appears ABOVE camera/gaze overlay

---

## 🧪 **How to Test the Fix**

### **Step 1: Refresh Browser**
Hard refresh to clear any cached JS:
- **Windows**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

### **Step 2: Open Console**
Press `F12` to see console logs

### **Step 3: Click Page Builder**
Click **🏗️ Page Builder** button

### **Step 4: Check Console**
You should see:
```
🏗️ Page Builder mounted
```

If you see:
```
🏗️ Page Builder mounted
🏗️ Page Builder unmounted
```
immediately after, there's still an error. Check for any red error messages in console.

---

## 🎯 **What You Should See Now**

### ✅ **Correct Behavior:**
1. Click **🏗️ Page Builder** button
2. Full-screen dark modal opens
3. Camera window still visible in BOTTOM RIGHT corner (smaller)
4. Page Builder UI visible with:
   - Title: "Page Builder"
   - Sidebar on right with prompt input
   - Canvas in center (empty state with 🎨 emoji)
   - Export buttons in header

### ❌ **If Still Not Working:**

#### **Check 1: Console Errors**
Open console (F12), look for red errors like:
- `TypeError`
- `ReferenceError`
- `Cannot read property of undefined`

#### **Check 2: Network Tab**
- Open Network tab in DevTools
- Check if backend is responding
- Should see requests to `localhost:8000`

#### **Check 3: React DevTools**
- Install React DevTools extension
- Check if `FullPageBuilder` component is in tree
- If not in tree = error causing unmount

---

## 🔍 **Debugging Commands**

### **Check if Page Builder is Open:**
Open console and type:
```javascript
document.querySelector('[style*="10000"]')
```
If Page Builder is open, you'll see the element. If `null`, it's not rendered.

### **Check z-index of visible elements:**
```javascript
Array.from(document.querySelectorAll('*'))
  .filter(el => window.getComputedStyle(el).position === 'fixed')
  .map(el => ({
    element: el.className,
    zIndex: window.getComputedStyle(el).zIndex
  }))
  .sort((a, b) => parseInt(b.zIndex) - parseInt(a.zIndex))
  .slice(0, 10)
```
This shows top 10 fixed elements by z-index. Page Builder should be first with `10000`.

---

## 💡 **Additional Fixes Applied**

1. **Debug Logging**: Added console logs to track mount/unmount
2. **Z-Index Fix**: Increased from 50 to 10000
3. **useEffect Import**: Added for proper lifecycle logging

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: Page Builder flickers and closes**
**Cause**: JavaScript error in component  
**Solution**: Check console for errors, look for missing props or undefined values

### **Issue 2: Camera window covers everything**
**Cause**: Gaze overlay z-index too high  
**Solution**: ✅ Already fixed (Page Builder now at 10000)

### **Issue 3: Blank screen when opening**
**Cause**: CSS conflict or missing styles  
**Solution**: Hard refresh (Ctrl+Shift+R)

### **Issue 4: "Cannot read property 'length' of undefined"**
**Cause**: `recentGazeData` prop is undefined  
**Solution**: Check that `recentGazeData` is passed from Index.tsx

---

## 📸 **Visual Confirmation**

### **When Working Correctly:**
```
┌─────────────────────────────────────────┐
│ Page Builder          [Export] [Close] │  ← Header (visible)
├──────────────┬──────────────────────────┤
│              │                          │
│   Canvas     │      Sidebar             │  ← Main area (visible)
│   (empty)    │   [Prompt input]         │
│              │   [Generate button]      │
│              │                          │
└──────────────┴──────────────────────────┘
                                  🎥 Camera ← Bottom right corner
```

### **When Broken (before fix):**
```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│          [NOTHING VISIBLE]              │
│                                         │
│                                         │
└─────────────────────────────────────────┘
                                  🎥 Camera ← Only this visible
```

---

## ✅ **Verification Checklist**

After hard refresh, check:
- [ ] Page Builder button is visible
- [ ] Clicking button opens full-screen modal
- [ ] Modal header shows "Page Builder" title
- [ ] Sidebar on right with textarea
- [ ] Empty state message in center
- [ ] Camera window still visible (bottom right)
- [ ] Console shows "🏗️ Page Builder mounted"
- [ ] No red errors in console

---

## 🎉 **Next Steps After Fix Works**

1. Type in prompt: `Create a modern landing page`
2. Click **✨ Generate Section**
3. Wait 5-10 seconds
4. Full page should appear in canvas
5. Try clicking **💻 Code** to toggle view
6. Try **⬇️ Download HTML** to export

---

## 🔗 **Related Files Modified**

- `src/components/FullPageBuilder.tsx` - Increased z-index to 10000
- `src/components/GazeOverlay.tsx` - Already at 9999 (no change needed)

---

**Status**: ✅ Fix Applied  
**Action**: Hard refresh browser and test again  
**Expected Result**: Full Page Builder UI now visible above camera window

