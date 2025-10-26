# 🔧 Multi-Section Generation Fix

## ❌ The Problem

When user types "Create a modern landing page", the system generates:
- ✅ ONE complete React component with all sections (Hero, Features, Pricing, etc.)
- ❌ But Page Builder treats this as ONE section
- ❌ User can't edit individual sections
- ❌ Gaze-based suggestions can't target specific sections

**What you see:**
```
Page Builder: "1 Section"
Canvas: [One big component with everything]
```

**What you need:**
```
Page Builder: "7 Sections"
Canvas: [Hero] [Features] [Pricing] [Testimonials] [CTA] [Footer]
         ↑        ↑          ↑            ↑          ↑      ↑
      Section 1  Section 2  Section 3   Section 4  Section 5 Section 6
```

---

## ✅ The Solution

I'm implementing a **Section Splitter** system that:

1. **Detects** landing page requests (`"landing page"`, `"website"`, etc.)
2. **Splits** into individual section prompts (Hero, Features, Pricing, etc.)
3. **Generates** each section separately using AI
4. **Returns** multiple sections to Page Builder
5. **Displays** each section as a separate, editable block

---

## 🛠️ Implementation

### Backend Changes

#### 1. **New: `backend/utils/section_splitter.py`**
```python
# Detects if prompt is for full landing page
detect_landing_page_request(prompt)

# Generates individual prompts for each section
get_section_prompts(prompt, page_type="saas")
# Returns: [
#   {"name": "Hero", "prompt": "Create hero for X", "order": 0},
#   {"name": "Features", "prompt": "Create features for X", "order": 1},
#   ...
# ]
```

#### 2. **New API Endpoint: `/api/generate-multi-section`**
- Input: Original prompt ("Create a landing page...")
- Process: Splits → Generates each section → Returns array
- Output: `{sections: [...], is_multi_section: true}`

#### 3. **Page Type Templates**
- **SaaS**: 7 sections (Nav, Hero, Features, Social Proof, Pricing, CTA, Footer)
- **Portfolio**: 6 sections (Nav, Hero, Projects, Skills, About, Contact)
- **Agency**: 7 sections (Nav, Hero, Services, Case Studies, Clients, CTA, Footer)

---

### Frontend Changes (TODO)

#### 1. **Update `FullPageBuilder.tsx`**
```typescript
// BEFORE: Single section generation
const handleGenerate = async () => {
  await generateComponent(prompt) // Returns 1 component
}

// AFTER: Multi-section generation
const handleGenerate = async () => {
  const result = await generateMultiSection(prompt)
  if (result.is_multi_section) {
    // Add all sections at once
    result.sections.forEach(section => addSection(section))
  }
}
```

#### 2. **Update Agent Coordinator**
Add new method:
```typescript
async generateMultiSection(request) {
  const response = await fetch('/api/generate-multi-section', {
    method: 'POST',
    body: JSON.stringify(request)
  })
  return await response.json()
}
```

#### 3. **Better Visual Separation**
```tsx
<PageBuilderCanvas>
  {sections.map(section => (
    <SectionBlock
      key={section.id}
      section={section}
      showLabel={true}  // "Hero Section"
      showBorder={true}  // Clear boundary
      onClick={() => selectSection(section.id)}  // For gaze editing
    />
  ))}
</PageBuilderCanvas>
```

---

## 📊 Before vs After

### BEFORE (Current - Broken)
```
User: "Create a landing page"
  ↓
Backend: Generates 1 big component
  ↓
Page Builder: Shows "1 Section"
  ↓
Canvas: [One massive component]
  ↓
Problem: Can't edit sections individually
```

### AFTER (Fixed)
```
User: "Create a landing page"
  ↓
Backend: Detects "landing page" keyword
  ↓
Backend: Splits into 7 section prompts
  ↓
Backend: Generates each section (Hero, Features, etc.)
  ↓
Frontend: Receives 7 separate components
  ↓
Page Builder: Shows "7 Sections"
  ↓
Canvas: [Hero] [Features] [Pricing] [Testimonials] [CTA] [Footer]
  ↓
User: Can click any section for gaze-based edits!
```

---

## 🎯 Next Steps

### Step 1: Update Frontend Agent Coordinator
**File:** `src/services/agents/agent-coordinator.ts`

Add new method:
```typescript
async generateMultiSection(request: ComponentGenerationRequest) {
  const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  
  try {
    const response = await fetch(`${backendURL}/api/generate-multi-section`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    })
    
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    
    return await response.json()
  } catch (error) {
    console.error('Multi-section generation failed:', error)
    throw error
  }
}
```

### Step 2: Update FullPageBuilder
**File:** `src/components/FullPageBuilder.tsx`

Modify `handleGenerate`:
```typescript
const handleGenerate = useCallback(async () => {
  if (!prompt.trim()) return
  if (isGenerating) return
  
  setIsGenerating(true)
  
  try {
    // Check if landing page request
    const isLandingPage = /landing page|full page|website|web page/i.test(prompt)
    
    if (isLandingPage) {
      console.log('🏗️ Generating multi-section landing page')
      
      // Call multi-section API
      const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
      const response = await fetch(`${backendURL}/api/generate-multi-section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      
      const result = await response.json()
      
      if (result.is_multi_section) {
        console.log(`✅ Generated ${result.sections.length} sections`)
        
        // Add each section
        result.sections.forEach((sectionData: any, index: number) => {
          const newSection: PageSection = {
            id: `section-${Date.now()}-${index}`,
            component: {
              id: `component-${Date.now()}-${index}`,
              name: sectionData.sectionName || sectionData.componentType,
              code: sectionData.code,
              dependencies: sectionData.dependencies || []
            },
            order: sectionData.sectionOrder || index
          }
          
          setSections(prev => [...prev, newSection])
        })
      }
    } else {
      // Single component (existing logic)
      await generateComponent(prompt)
    }
    
    setPrompt('')
  } catch (error) {
    console.error('Generation error:', error)
  } finally {
    setIsGenerating(false)
  }
}, [prompt, isGenerating, generateComponent])
```

### Step 3: Enhance Visual Separation
**File:** `src/components/PageBuilderCanvas.tsx`

Update section rendering:
```typescript
<div
  key={section.id}
  className="relative border-4 border-slate-300 hover:border-blue-500 transition-all group bg-white"
  style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
>
  {/* Section Label - Always Visible */}
  <div className="absolute top-0 left-0 right-0 bg-slate-900/90 text-white px-4 py-2 z-20">
    <div className="flex items-center justify-between">
      <span className="font-bold">{section.component.name}</span>
      <span className="text-xs text-slate-400">Section {section.order + 1}</span>
    </div>
  </div>

  {/* Section Content */}
  <iframe
    srcDoc={html}
    className="w-full border-0"
    style={{ minHeight: '400px', marginTop: '40px' }}  // Space for label
  />
</div>
```

---

## 🧪 Testing

### Test 1: Multi-Section Generation
1. Start backend: `cd backend && python main.py`
2. Start frontend: `npm run dev`
3. Open Page Builder (`Cmd/Ctrl + Alt + P`)
4. Type: *"Create a modern SaaS landing page"*
5. Click Generate

**Expected:**
- Progress: "Generating section 1 of 7..."
- Result: 7 separate sections appear
- Bottom indicator: "7 Sections"

### Test 2: Single Section Still Works
1. Type: *"Create a hero section"*
2. Click Generate

**Expected:**
- Only 1 section generated (not split)
- Works as before

### Test 3: Visual Separation
1. After generating landing page
2. Look at the canvas

**Expected:**
- Clear borders between sections
- Section labels visible ("Hero", "Features", etc.)
- Each section clickable independently

---

## 🎯 Benefits

1. **Individual Section Editing**
   - Click on Features section → Gaze-based edit suggestions
   - Click on Pricing → Optimize pricing layout
   - Click on Hero → A/B test headlines

2. **Better UX**
   - Clear visual boundaries
   - Know exactly which section you're looking at
   - Easier navigation

3. **Scalability**
   - Add/remove sections easily
   - Reorder sections by dragging
   - Duplicate sections

4. **Gaze Optimization**
   - Analyze gaze per section
   - "Users spend 3 seconds on Hero but skip Features"
   - "Move CTA higher in Pricing section"

---

## 📋 Implementation Checklist

### Backend (✅ DONE)
- [x] Create `backend/utils/section_splitter.py`
- [x] Add `/api/generate-multi-section` endpoint
- [x] Add section templates (SaaS, Portfolio, Agency)

### Frontend (🚧 TODO)
- [ ] Update `agent-coordinator.ts` with `generateMultiSection()`
- [ ] Update `FullPageBuilder.tsx` to use multi-section API
- [ ] Enhance `PageBuilderCanvas.tsx` visual separation
- [ ] Add section labels (always visible)
- [ ] Test multi-section generation

### Polish (🚧 TODO)
- [ ] Add loading progress per section ("2 of 7 sections...")
- [ ] Add section reordering (drag & drop)
- [ ] Add "Edit Section" button on hover
- [ ] Add "Duplicate Section" feature

---

## 🎉 Result

After this fix, when user types "Create a landing page":
- ✅ 7 separate sections generated
- ✅ Each section editable individually  
- ✅ Clear visual boundaries
- ✅ Gaze-based editing per section
- ✅ Page Builder shows "7 Sections"

**This is exactly what v0/Bolt.new does!** 🚀

---

**Ready to implement the frontend changes?** Let me know and I'll update the files!

