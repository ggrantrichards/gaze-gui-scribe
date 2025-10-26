# 🚀 Next Steps: Full Landing Page & Web App Generation

## ✅ **What's Working Now**
- ✅ Backend API generating components successfully
- ✅ GPT-4 responding and creating React code
- ✅ Components rendering in iframe (vanilla React)
- ✅ Page Builder UI fully functional
- ✅ Gaze tracking active

## ❌ **Current Issue**
GPT-4 is generating **simple components** (like an email form) instead of **full landing pages** with multiple sections.

---

## 🎯 **Goals**

### **Phase 1: Fix Full Page Generation** (2-3 hours)
- Generate complete landing pages with 5+ sections
- Support different page types (SaaS, portfolio, e-commerce)
- Multi-section layouts (nav, hero, features, pricing, footer)

### **Phase 2: Multi-LLM Support via OpenRouter** (1-2 hours)
- Integrate OpenRouter API
- Test multiple models (Claude, Llama, Mistral, etc.)
- Let users choose preferred LLM
- Compare quality across models

### **Phase 3: Gaze-Driven Suggestion Popups** (2-3 hours)
- Detect when user looks at component for 2+ seconds
- Show small popup with AI suggestions
- "This CTA button could be more prominent"
- "Consider adding spacing here"
- One-click apply suggestions

---

## 📊 **Root Cause Analysis**

### **Why It's Generating Simple Components:**

1. **Prompt Engineering Issue**
   - Current system prompt emphasizes "component generation"
   - GPT-4 interprets this as single components
   - Need to explicitly request multi-section pages

2. **Token Limit**
   - May be hitting GPT-4's response limit
   - Full landing pages need more tokens
   - Need to increase `max_tokens` or use streaming

3. **Code Structure**
   - GPT-4 trained on component libraries
   - Naturally generates modular components
   - Need explicit examples of full-page structure

---

## 🔧 **Phase 1: Fix Full Page Generation**

### **Step 1.1: Update System Prompt**
**File**: `backend/agents/component_generator_agent.py`

**Current Issue**: Prompt says "Generate a React component"
**Fix**: Change to "Generate a complete React page with multiple sections"

```python
def build_system_prompt(request: ComponentGenerationRequest) -> str:
    # Detect if request is for full page vs single component
    is_full_page = any(word in request.prompt.lower() for word in [
        'landing page', 'website', 'web app', 'homepage', 'full page'
    ])
    
    if is_full_page:
        return build_full_page_prompt(request)
    else:
        return build_component_prompt(request)

def build_full_page_prompt(request: ComponentGenerationRequest) -> str:
    return """You are an expert web developer creating COMPLETE landing pages.

CRITICAL REQUIREMENTS:
1. Generate a FULL PAGE with 5-7 distinct sections
2. Include ALL of these sections:
   - Navigation bar (sticky/fixed)
   - Hero section (large, eye-catching)
   - Features section (3-4 features with icons)
   - Social proof (testimonials or stats)
   - Call-to-action section
   - Footer (links, copyright)

3. Use VANILLA REACT ONLY (no Next.js imports)
4. Use React.useState for all hooks
5. Use <img> NOT <Image>, <a> NOT <Link>
6. Export as: export function PageName() { ... }
7. Each section should be 200-400px tall
8. Use Tailwind CSS for ALL styling
9. Make it responsive (mobile-first)
10. Include placeholder images from Unsplash

STRUCTURE TEMPLATE:
export function LandingPage() {
  const [email, setEmail] = React.useState('');
  const [menuOpen, setMenuOpen] = React.useState(false);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation - sticky at top */}
      <nav className="sticky top-0 bg-white shadow-md z-50">
        {/* Nav content - logo, links, CTA button */}
      </nav>
      
      {/* Hero Section - full viewport height */}
      <section className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        {/* Large headline, subheadline, 2 CTA buttons, hero image */}
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-white">
        {/* Grid of 3-4 features with icons, titles, descriptions */}
      </section>
      
      {/* Social Proof / Testimonials */}
      <section className="py-20 bg-gray-100">
        {/* Customer testimonials or statistics */}
      </section>
      
      {/* Pricing (if relevant) */}
      <section className="py-20 bg-white">
        {/* 3-tier pricing cards */}
      </section>
      
      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        {/* Strong call-to-action */}
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        {/* Footer links, social icons, copyright */}
      </footer>
    </div>
  );
}

IMPORTANT:
- Each section must be visually distinct
- Use gradients, shadows, and spacing liberally
- Include real placeholder images from Unsplash
- Make buttons large and prominent
- Use modern color schemes
- Total output should be 400-800 lines of code

Return ONLY the complete page code, no explanations."""
```

### **Step 1.2: Increase Token Limit**
**File**: `backend/main.py`

```python
response = await openai_client.chat.completions.create(
    model="gpt-4-turbo-preview",
    messages=[...],
    temperature=0.7,
    max_tokens=4000,  # Increased from 2000 to 4000
)
```

### **Step 1.3: Add Full Page Examples to Prompt**
Include 2-3 complete examples of well-structured landing pages in the system prompt.

### **Step 1.4: Post-Processing Check**
**File**: `backend/main.py`

```python
# After generation, check if it's actually a full page
def validate_full_page(code: str) -> bool:
    sections = code.count('</section>')
    has_nav = 'nav' in code.lower()
    has_footer = 'footer' in code.lower()
    is_long_enough = len(code) > 1500  # At least 1500 chars
    
    return sections >= 4 and has_nav and has_footer and is_long_enough

if is_full_page_request and not validate_full_page(code):
    # Regenerate with more explicit instructions
    # OR return error asking user to be more specific
```

---

## 🌐 **Phase 2: Multi-LLM Support via OpenRouter**

### **Why OpenRouter?**
- Access to 100+ models with one API
- Claude 3, Llama 3, Mistral, Gemini, etc.
- Unified interface
- Pay per use
- Model fallbacks

### **Step 2.1: Install OpenRouter**
```bash
cd backend
pip install openai  # OpenRouter uses OpenAI SDK
```

### **Step 2.2: Add OpenRouter Configuration**
**File**: `backend/.env`

```bash
# OpenRouter API Key
OPENROUTER_API_KEY=sk-or-v1-...

# Choose default model
DEFAULT_MODEL=anthropic/claude-3-sonnet
# Options:
# - anthropic/claude-3-opus (best quality, expensive)
# - anthropic/claude-3-sonnet (balanced)
# - meta-llama/llama-3-70b (fast, cheap)
# - mistralai/mixtral-8x7b (good for code)
# - google/gemini-pro (Google's model)
```

### **Step 2.3: Create OpenRouter Client**
**File**: `backend/services/openrouter_client.py`

```python
from openai import AsyncOpenAI
import os

class OpenRouterClient:
    def __init__(self):
        self.client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
        )
        self.default_model = os.getenv("DEFAULT_MODEL", "anthropic/claude-3-sonnet")
    
    async def generate_component(
        self, 
        prompt: str, 
        system_prompt: str,
        model: str = None,
        max_tokens: int = 4000
    ) -> str:
        model = model or self.default_model
        
        response = await self.client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=max_tokens,
            extra_headers={
                "HTTP-Referer": "https://clientsight.dev",  # Your app URL
                "X-Title": "ClientSight Page Builder",
            }
        )
        
        return response.choices[0].message.content

# Model comparison
MODELS = {
    'claude-3-opus': {
        'id': 'anthropic/claude-3-opus',
        'name': 'Claude 3 Opus',
        'description': 'Best quality, most expensive',
        'context': '200k tokens',
        'cost': '$15/$75 per 1M tokens',
    },
    'claude-3-sonnet': {
        'id': 'anthropic/claude-3-sonnet',
        'name': 'Claude 3 Sonnet',
        'description': 'Balanced quality/cost',
        'context': '200k tokens',
        'cost': '$3/$15 per 1M tokens',
    },
    'gpt-4-turbo': {
        'id': 'openai/gpt-4-turbo',
        'name': 'GPT-4 Turbo',
        'description': 'OpenAI flagship',
        'context': '128k tokens',
        'cost': '$10/$30 per 1M tokens',
    },
    'llama-3-70b': {
        'id': 'meta-llama/llama-3-70b-instruct',
        'name': 'Llama 3 70B',
        'description': 'Fast, cheap, good',
        'context': '8k tokens',
        'cost': '$0.59/$0.79 per 1M tokens',
    },
    'mixtral-8x7b': {
        'id': 'mistralai/mixtral-8x7b-instruct',
        'name': 'Mixtral 8x7B',
        'description': 'Great for code',
        'context': '32k tokens',
        'cost': '$0.24/$0.24 per 1M tokens',
    },
}
```

### **Step 2.4: Add Model Selection to Frontend**
**File**: `src/components/FullPageBuilder.tsx`

```typescript
const [selectedModel, setSelectedModel] = useState<string>('claude-3-sonnet')

// Add to sidebar
<div className="mt-6">
  <h3 className="text-sm font-semibold text-slate-400 mb-3">AI Model</h3>
  <select
    value={selectedModel}
    onChange={(e) => setSelectedModel(e.target.value)}
    className="w-full bg-slate-700 text-white px-3 py-2 rounded"
  >
    <option value="claude-3-opus">Claude 3 Opus (Best)</option>
    <option value="claude-3-sonnet">Claude 3 Sonnet (Balanced)</option>
    <option value="gpt-4-turbo">GPT-4 Turbo</option>
    <option value="llama-3-70b">Llama 3 70B (Fast)</option>
    <option value="mixtral-8x7b">Mixtral 8x7B (Code)</option>
  </select>
  <p className="text-xs text-slate-500 mt-1">
    Different models excel at different tasks
  </p>
</div>
```

### **Step 2.5: Update Backend to Accept Model**
**File**: `backend/main.py`

```python
class FrontendComponentGenerationRequest(BaseModel):
    prompt: str
    model: Optional[str] = None  # NEW
    gazeContext: Optional[Dict] = None
    # ...

@app.post("/api/generate-component")
async def generate_component_endpoint(request: FrontendComponentGenerationRequest):
    # Use OpenRouter if model specified
    if request.model:
        openrouter = OpenRouterClient()
        code = await openrouter.generate_component(
            prompt=request.prompt,
            system_prompt=build_system_prompt(...),
            model=MODELS[request.model]['id']
        )
    else:
        # Use default OpenAI
        # ... existing code
```

---

## 👁️ **Phase 3: Gaze-Driven Suggestion Popups**

### **Concept:**
When user stares at a component for 2+ seconds, show a small popup with AI-generated improvement suggestions.

### **Step 3.1: Component Attention Detector**
**File**: `src/hooks/useComponentAttention.ts`

```typescript
export function useComponentAttention(componentRefs: React.RefObject<HTMLElement>[]) {
  const [focusedComponent, setFocusedComponent] = useState<string | null>(null)
  const [dwellTime, setDwellTime] = useState<number>(0)
  
  useEffect(() => {
    // Track which component user is looking at
    const checkGaze = (gazePoint: GazePoint) => {
      for (const ref of componentRefs) {
        if (!ref.current) continue
        
        const rect = ref.current.getBoundingClientRect()
        const isLooking = (
          gazePoint.x >= rect.left &&
          gazePoint.x <= rect.right &&
          gazePoint.y >= rect.top &&
          gazePoint.y <= rect.bottom
        )
        
        if (isLooking) {
          setFocusedComponent(ref.current.id)
          setDwellTime(prev => prev + 100) // Increment by 100ms
          return
        }
      }
      
      // Not looking at any component
      setFocusedComponent(null)
      setDwellTime(0)
    }
    
    const interval = setInterval(() => {
      const gaze = getCurrentGaze() // From WebGazer
      if (gaze) checkGaze(gaze)
    }, 100)
    
    return () => clearInterval(interval)
  }, [componentRefs])
  
  // Trigger suggestion when dwell time > 2 seconds
  const shouldShowSuggestion = dwellTime >= 2000
  
  return { focusedComponent, dwellTime, shouldShowSuggestion }
}
```

### **Step 3.2: Suggestion Popup Component**
**File**: `src/components/GazeSuggestionPopup.tsx`

```typescript
interface GazeSuggestionPopupProps {
  componentId: string
  componentCode: string
  position: { x: number; y: number }
  onClose: () => void
  onApply: (newCode: string) => void
}

export function GazeSuggestionPopup({
  componentId,
  componentCode,
  position,
  onClose,
  onApply
}: GazeSuggestionPopupProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Generate suggestions from AI
    async function generateSuggestions() {
      const response = await agentCoordinator.optimizeWithGaze({
        componentId,
        currentCode: componentCode,
        gazeData: []  // Optional: pass recent gaze data
      })
      
      setSuggestions(response.suggestions.map(s => s.recommendation))
      setIsLoading(false)
    }
    
    generateSuggestions()
  }, [componentId, componentCode])
  
  return (
    <div
      className="fixed bg-slate-800 rounded-lg shadow-2xl p-4 border-2 border-blue-500"
      style={{
        left: position.x,
        top: position.y,
        maxWidth: '300px',
        zIndex: 10001,
        animation: 'fadeIn 0.2s'
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">👁️</span>
          <h4 className="text-white font-semibold text-sm">AI Suggestions</h4>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          ✕
        </button>
      </div>
      
      {isLoading ? (
        <div className="text-gray-400 text-sm">Analyzing component...</div>
      ) : (
        <div className="space-y-2">
          {suggestions.map((suggestion, i) => (
            <div
              key={i}
              className="bg-slate-700 p-3 rounded text-sm text-gray-200 hover:bg-slate-600 cursor-pointer transition-colors"
              onClick={() => {
                // Apply suggestion
                onApply(suggestion)
                onClose()
              }}
            >
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">💡</span>
                <span>{suggestion}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-3 pt-3 border-t border-slate-600 text-xs text-gray-400">
        Keep looking to see more suggestions
      </div>
    </div>
  )
}
```

### **Step 3.3: Integrate into Page Builder**
**File**: `src/components/PageBuilderCanvas.tsx`

```typescript
const [showSuggestionPopup, setShowSuggestionPopup] = useState(false)
const [suggestionTarget, setSuggestionTarget] = useState<{
  componentId: string;
  code: string;
  position: { x: number; y: number };
} | null>(null)

// Use attention hook
const { focusedComponent, shouldShowSuggestion } = useComponentAttention(sectionRefs)

useEffect(() => {
  if (shouldShowSuggestion && focusedComponent) {
    // Get component position
    const element = document.getElementById(focusedComponent)
    if (element) {
      const rect = element.getBoundingClientRect()
      
      setSuggestionTarget({
        componentId: focusedComponent,
        code: sections.find(s => s.id === focusedComponent)?.component.code || '',
        position: {
          x: rect.right + 10,  // Show to the right
          y: rect.top
        }
      })
      setShowSuggestionPopup(true)
    }
  }
}, [shouldShowSuggestion, focusedComponent])

// Render popup
{showSuggestionPopup && suggestionTarget && (
  <GazeSuggestionPopup
    componentId={suggestionTarget.componentId}
    componentCode={suggestionTarget.code}
    position={suggestionTarget.position}
    onClose={() => setShowSuggestionPopup(false)}
    onApply={(newCode) => {
      // Update component code
      updateComponentCode(suggestionTarget.componentId, newCode)
    }}
  />
)}
```

---

## 📋 **Implementation Timeline**

### **Week 1: Full Page Generation**
**Day 1-2**: Update prompts and test
- [ ] Rewrite system prompt for full pages
- [ ] Add full page detection logic
- [ ] Increase token limits
- [ ] Test with 10+ different page types

**Day 3**: Validation and refinement
- [ ] Add post-processing validation
- [ ] Create page templates (SaaS, portfolio, e-commerce)
- [ ] Test responsiveness

### **Week 2: Multi-LLM Support**
**Day 1**: OpenRouter setup
- [ ] Create OpenRouter account
- [ ] Install SDK
- [ ] Test basic API calls

**Day 2**: Integration
- [ ] Create OpenRouterClient class
- [ ] Update backend endpoints
- [ ] Add model selection to frontend

**Day 3**: Testing and comparison
- [ ] Test all 5 models
- [ ] Compare quality for landing pages
- [ ] Document which models work best
- [ ] Add cost tracking

### **Week 3: Gaze Suggestions**
**Day 1-2**: Attention detection
- [ ] Build useComponentAttention hook
- [ ] Test dwell time accuracy
- [ ] Handle edge cases (rapid eye movement)

**Day 3-4**: Suggestion system
- [ ] Build GazeSuggestionPopup component
- [ ] Integrate with GazeOptimizerAgent
- [ ] Test suggestion quality

**Day 5**: Polish and UX
- [ ] Add animations
- [ ] Handle multiple components
- [ ] Add "Don't show again" option
- [ ] Save user preferences

---

## 🎯 **Success Metrics**

### **Full Page Generation:**
- ✅ 90%+ of "landing page" requests generate 5+ sections
- ✅ Pages are 2000+ lines of code
- ✅ All pages include nav and footer
- ✅ Mobile responsive

### **Multi-LLM:**
- ✅ All 5 models accessible
- ✅ < 30 second generation time
- ✅ Model comparison data collected
- ✅ Cost per page tracked

### **Gaze Suggestions:**
- ✅ Popup appears within 2.5 seconds of focus
- ✅ Suggestions are relevant 80%+ of time
- ✅ < 3 second suggestion generation
- ✅ Users apply 30%+ of suggestions

---

## 🔧 **Quick Wins to Try First**

### **1. Test OpenRouter Claude 3 Opus**
Claude 3 Opus is currently the best model for code generation. Try it FIRST before doing full integration:

```bash
# Quick test script
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -d '{
    "model": "anthropic/claude-3-opus",
    "messages": [
      {
        "role": "user",
        "content": "Generate a complete React landing page for a SaaS product with nav, hero, features, pricing, and footer. Use Tailwind CSS and React.useState for hooks. Export as one function."
      }
    ]
  }'
```

If this generates better pages, prioritize OpenRouter integration!

### **2. Add "Full Page Mode" Toggle**
Quick frontend change:

```typescript
const [fullPageMode, setFullPageMode] = useState(true)

// In prompt textarea placeholder:
{fullPageMode 
  ? "Describe the landing page you want (automatically includes all sections)"
  : "Describe a single component"
}
```

Then modify backend to always request full pages when this is on.

### **3. Template Library**
Instead of generating from scratch, start with templates:

```typescript
const TEMPLATES = {
  'saas-landing': 'SaaS product landing page with hero, features, pricing',
  'portfolio': 'Portfolio website with projects gallery and contact',
  'ecommerce': 'E-commerce homepage with product grid and categories',
}

// Let users click template, then AI customizes it
```

---

## 💡 **Recommended Approach**

### **Priority Order:**

1. **Fix Full Page Generation** (HIGH PRIORITY)
   - This is the core issue
   - Users expect full pages
   - Takes 2-3 hours

2. **Add OpenRouter Claude 3** (MEDIUM PRIORITY)
   - Claude is better at code than GPT-4
   - Easy to integrate
   - Takes 1-2 hours

3. **Gaze Suggestions** (LOW PRIORITY for now)
   - Cool feature but not essential
   - Can be added later
   - Takes 2-3 hours

### **For Cal Hacks Demo:**

Focus on #1 and #2. Get full pages working with Claude 3. That's your competitive advantage:
- ✅ Full landing pages from text
- ✅ Multiple AI models to choose from
- ✅ Gaze tracking (already works)
- ✅ Export to HTML

---

## 📝 **Files You'll Need to Modify**

### **Phase 1: Full Pages**
1. `backend/agents/component_generator_agent.py` - Update prompt
2. `backend/main.py` - Increase tokens, add validation
3. (Optional) `backend/templates/` - Add page templates

### **Phase 2: OpenRouter**
1. `backend/services/openrouter_client.py` - New file
2. `backend/main.py` - Add model parameter
3. `backend/.env` - Add OPENROUTER_API_KEY
4. `src/components/FullPageBuilder.tsx` - Add model selector
5. `src/types.ts` - Add model types

### **Phase 3: Gaze Suggestions**
1. `src/hooks/useComponentAttention.ts` - New file
2. `src/components/GazeSuggestionPopup.tsx` - New file
3. `src/components/PageBuilderCanvas.tsx` - Integrate popup
4. `backend/agents/gaze_optimizer_agent.py` - Already exists!

---

## 🎉 **Summary**

**Current State**: Basic component generation works, but not full pages

**Target State**: Full landing page generation with multiple LLMs and gaze-driven suggestions

**Estimated Time**: 
- Phase 1: 2-3 hours
- Phase 2: 1-2 hours  
- Phase 3: 2-3 hours
- **Total**: 5-8 hours

**For your Cal Hacks demo**, focus on Phases 1 & 2. You'll have a unique product that:
- Generates full landing pages from text ✅
- Uses multiple AI models (not just GPT) ✅
- Tracks user attention with eye gaze ✅
- Exports complete HTML ✅

**Next action**: Start with updating the system prompt in `component_generator_agent.py` to request full pages instead of components!

---

**I'm ready to help you implement any of these phases! Just let me know which one you want to tackle first.** 🚀

