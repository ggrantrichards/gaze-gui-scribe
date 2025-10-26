# 🧪 Test Guide - Smooth Scrolling & Interactive Landing Pages

## 🎯 What to Test

This guide will help you verify that the new smooth scrolling and interactive features are working correctly.

---

## 🚀 Quick Setup (2 minutes)

### Step 1: Start Backend
```bash
cd backend
python main.py
```

**Look for:**
```
✅ OpenRouter API key found
🎉 All agents ready!
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 2: Start Frontend (New Terminal)
```bash
npm run dev
```

**Look for:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

### Step 3: Open Browser
- Go to `http://localhost:5173`
- Press `Cmd/Ctrl + Alt + P` (Opens Page Builder)

---

## ✅ Test 1: Generate Interactive Landing Page

### Steps:
1. In Page Builder sidebar, select **Claude 3.5 Sonnet**
2. Type this exact prompt:
   ```
   Create a modern SaaS landing page for a project management tool with all sections
   ```
3. Click **✨ Generate Section**
4. Wait ~10 seconds for generation

### ✅ Expected Result:
- **5-7 sections appear** (Hero, Features, Pricing, Testimonials, CTA, Footer)
- **Navigation bar at top** (sticky)
- **Full-screen canvas** (no max-width box)
- **Each section is full-width**
- **Clean visual separation** between sections

### ❌ If something's wrong:
- **Blank screen?** → Check browser console (F12) for errors
- **Only 1-2 sections?** → Backend might not be using updated prompts (restart: `python main.py`)
- **Not full-width?** → Hard refresh: `Cmd/Ctrl + Shift + R`

---

## ✅ Test 2: Verify Smooth Scrolling

### Steps:
1. **After Test 1** (landing page generated)
2. Look for **navigation bar** at the top of the page
3. **Click "Features"** link in navigation
4. **Observe the page scroll**
5. **Click "Pricing"** link
6. **Observe the page scroll**
7. Try clicking other nav links

### ✅ Expected Result:
- **Smooth animated scroll** (not instant jump)
- **Takes ~0.5-1 second** to scroll
- **Scrolls to correct section**
- **Navigation stays sticky** at top while scrolling
- **Section appears at top of viewport** (not cut off)

### ❌ If something's wrong:
- **Instant jump (no animation)?** 
  - Try in Chrome (best smooth scroll support)
  - Check if `scroll-behavior: smooth` CSS exists
  - Regenerate with Claude 3.5 (follows prompts best)

- **Scrolls to wrong section?**
  - Section IDs might be missing
  - Regenerate the page

- **Navigation doesn't work?**
  - Check browser console for errors
  - Try clicking directly on the text

---

## ✅ Test 3: Check Section IDs

### Steps:
1. **Right-click** on any section → **Inspect Element**
2. Look at the `<section>` tag
3. Verify it has an `id` attribute

### ✅ Expected Result:
```html
<section id="hero" className="...">
  <!-- Hero content -->
</section>

<section id="features" className="py-20">
  <!-- Features content -->
</section>

<section id="pricing" className="...">
  <!-- Pricing content -->
</section>
```

### ❌ If IDs are missing:
- Backend prompts might not be updated
- Restart backend: `cd backend && python main.py`
- Regenerate the page

---

## ✅ Test 4: Test on Mobile (Responsive)

### Steps:
1. Open Chrome DevTools (F12)
2. Click **Toggle Device Toolbar** (or press `Cmd/Ctrl + Shift + M`)
3. Select **iPhone 12 Pro** or **iPad**
4. **Scroll through the page**
5. Try clicking navigation links

### ✅ Expected Result:
- Layout adapts to mobile screen
- Navigation is responsive
- Smooth scroll still works
- All sections visible
- Text is readable (not too small)

---

## ✅ Test 5: Compare Models

### Steps:
1. Generate with **Llama 3.1 70B** (fast, free):
   ```
   Create a SaaS landing page
   ```
2. Note the quality and speed (~5 seconds)

3. Generate again with **Claude 3.5 Sonnet**:
   ```
   Create a SaaS landing page
   ```
4. Note the quality and speed (~10 seconds)

### ✅ Expected Result:
- **Llama:** Faster, simpler design
- **Claude:** Slower, more polished design
- **Both should have:** Smooth scroll, section IDs, full-width

### 💡 Recommendation:
- Use **Claude 3.5** for Cal Hacks demos (best quality)
- Use **Llama** for quick testing (free, unlimited)

---

## ✅ Test 6: Full-Screen Canvas

### Steps:
1. Generate a landing page (any model)
2. **Look at the canvas area** (where the page renders)
3. **Check if it fills the entire screen**
4. **Scroll down** to see all sections

### ✅ Expected Result:
- Canvas fills **entire right side** of screen
- **No max-width container** around sections
- Sections are **full-width**
- Background is **white** (not gray)
- **Floating stats indicator** in bottom-left ("X Sections")

### ❌ If boxed/constrained:
- Hard refresh: `Cmd/Ctrl + Shift + R`
- Check PageBuilderCanvas.tsx uses `w-full`
- Restart frontend: `npm run dev`

---

## ✅ Test 7: Interactive Elements

### Steps:
1. Generate a landing page with a form (e.g., email signup)
2. Try **typing in the input field**
3. Try **clicking buttons**
4. Try **hovering over elements**

### ✅ Expected Result:
- **Input fields work** (can type)
- **Buttons have hover states** (color changes)
- **Forms are functional** (can submit, shows alert)
- **Interactive elements respond** to mouse

---

## 🎯 Success Criteria

Your implementation is **working correctly** if:

- [x] Landing pages have 5-7 sections
- [x] Navigation bar is sticky at top
- [x] Clicking nav links **smoothly scrolls** to sections
- [x] Canvas is **full-screen** (not boxed)
- [x] Each section has an `id` attribute
- [x] Smooth scroll animation is visible (~0.5s)
- [x] Works on mobile/responsive
- [x] Interactive elements work (forms, buttons)
- [x] Claude 3.5 generates better quality than Llama
- [x] No console errors

---

## 🐛 Common Issues & Fixes

### Issue 1: "No sections generated"
**Cause:** Backend not running or not updated  
**Fix:**
```bash
cd backend
python main.py  # Restart backend
```

### Issue 2: "Smooth scroll not working"
**Cause:** Browser doesn't support or code missing  
**Fix:**
- Try in Chrome (best support)
- Regenerate with Claude 3.5
- Check console for errors

### Issue 3: "Sections are boxed, not full-width"
**Cause:** Old code cached  
**Fix:**
```bash
# Hard refresh
Cmd/Ctrl + Shift + R

# Or restart frontend
npm run dev
```

### Issue 4: "Navigation links don't work"
**Cause:** Section IDs missing or onclick handlers missing  
**Fix:**
- Regenerate the page
- Restart backend (to load new prompts)
- Check browser console for errors

### Issue 5: "OpenRouter not available"
**Cause:** API key not set  
**Fix:**
```bash
cd backend
# Edit .env and add:
OPENROUTER_API_KEY=sk-or-v1-your-key
```

---

## 📊 Performance Benchmarks

| Model | Speed | Quality | Smooth Scroll |
|-------|-------|---------|---------------|
| **Claude 3.5** | ~10s | ⭐⭐⭐⭐⭐ | ✅ Yes |
| **GPT-4 Turbo** | ~12s | ⭐⭐⭐⭐⭐ | ✅ Yes |
| **Llama 3.1** | ~5s | ⭐⭐⭐⭐ | ✅ Yes |
| **Mixtral** | ~7s | ⭐⭐⭐⭐ | ✅ Yes |

---

## 🎉 You're Ready!

If all tests pass, your implementation is **production-ready** for Cal Hacks! 🚀

**Next Steps:**
1. ✅ Practice the demo (3x)
2. ✅ Test on multiple browsers
3. ✅ Prepare talking points
4. ✅ Show judges the smooth scroll feature!

---

## 💡 Demo Tips

### What to Highlight:
1. **"Watch the smooth scrolling"** - Click nav links
2. **"It's fully interactive"** - Try the forms
3. **"Generated in 10 seconds"** - Show the generation
4. **"Eye-tracking integrated"** - Show the gaze overlay
5. **"Production-ready code"** - Show the code view

### Sample Demo Script:
> "I'll generate a complete landing page. Watch how the navigation smoothly scrolls to each section—this is all AI-generated. Unlike v0, we also use eye-tracking to optimize where elements should be placed based on actual user attention."

---

**Questions?** Check `PHASE1_IMPLEMENTATION_COMPLETE.md` for more details!

Good luck! 🎯

