# ClientSight Quick Reference Card
*Print this page and keep it at your desk!*

---

## 📚 Document Quick Links

| What I Need | Which Document | Time to Read |
|-------------|----------------|--------------|
| Big picture overview | `visual-roadmap.md` | 10 min |
| Original vision | `prd.md` | 30 min |
| Technical architecture | `agentic-builder-development-plan.md` | 4 hours |
| Start coding now | `implementation-quick-start.md` | 30 min |
| Plan my sprint | `task-breakdown.md` | 1 hour |

---

## 🎯 Current Phase Status

```
Phase 0: ████████████████████░░░░░░░░ [Existing Foundation]
Phase 1: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ [AI Agent Core - Weeks 1-8]
Phase 2: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ [Live Preview - Weeks 9-12]
Phase 3: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ [Gaze Analytics - Weeks 13-16]
Phase 4: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ [Design System - Weeks 17-20]
Phase 5: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ [Export/Deploy - Weeks 21-24]
Phase 6: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ [Collaboration - Weeks 25-28]
Phase 7: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ [Polish/Launch - Weeks 29-30]
```

---

## 🚀 Weekly Milestones

| Week | Milestone | Demo-able Feature |
|------|-----------|-------------------|
| 4 | First AI component | "Generate a button" works |
| 8 | Foundation complete | Multiple component types |
| 12 | Full workspace | Split-pane editor + preview |
| 16 | Gaze analytics | Show heatmap, AI suggestions |
| 20 | Design system | 30+ components ready |
| 24 | MVP complete | Export to GitHub/Vercel |
| 28 | Collaboration | Real-time co-editing |
| 30 | PUBLIC LAUNCH | Ship it! 🚀 |

---

## 💻 Essential Commands

### Setup (Week 1)
```bash
# Install dependencies
npm install openai @anthropic-ai/sdk langchain zustand immer
npm install @codesandbox/sandpack-react @monaco-editor/react
npm install yjs y-websocket d3 recharts

# Configure environment
cp .env.example .env.local
# Add your VITE_OPENAI_API_KEY

# Create file structure
mkdir -p src/{services/{ai,analytics,codegen},store,design-system}
```

### Development
```bash
# Start dev server
npm run dev

# Run tests
npm test

# Lint & format
npm run lint
npm run format

# Build for production
npm run build
```

---

## 🔧 Core Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **AI** | OpenAI GPT-4 | Component generation |
| **State** | Zustand + Immer | Global state management |
| **Preview** | Sandpack | Live component preview |
| **Editor** | Monaco | Code editing |
| **Gaze** | WebGazer.js | Eye tracking (existing) |
| **Analytics** | D3.js | Heatmap visualization |
| **Collab** | Yjs + WebSocket | Real-time sync |

---

## 📁 Key Files to Know

### Existing (Don't Break!)
```
src/hooks/useGazeTracker.ts         ← Gaze tracking core
src/components/Calibration.tsx      ← Calibration UI
src/components/GazeOverlay.tsx      ← Gaze cursor
src/utils/nlpParser.ts              ← Basic NLP (upgrade this)
```

### Create These (Phase 1)
```
src/services/ai/llm-client.ts       ← OpenAI integration
src/store/builder-store.ts          ← Zustand store
src/hooks/useCodeGeneration.ts      ← Component generation
src/types.ts                         ← Add new types
```

### Create These (Phase 2)
```
src/components/builder/BuilderWorkspace.tsx
src/components/builder/LivePreview.tsx
src/components/builder/CodeEditor.tsx
src/components/builder/PromptPanel.tsx
```

---

## 🐛 Common Issues & Fixes

### Issue: CORS error with OpenAI API
```typescript
// Temporary (dev only):
const openai = new OpenAI({ 
  apiKey: '...', 
  dangerouslyAllowBrowser: true 
})

// Production: Use backend proxy
```

### Issue: Gaze tracking interferes with preview
```css
.gaze-overlay {
  pointer-events: none;
  z-index: 9999;
}
```

### Issue: Generated code has syntax errors
```typescript
import * as babel from '@babel/parser'

function validateSyntax(code: string) {
  try {
    babel.parse(code, { 
      sourceType: 'module', 
      plugins: ['jsx', 'typescript'] 
    })
    return true
  } catch {
    return false
  }
}
```

---

## 📊 Success Criteria Checklist

### Phase 1 (Week 8)
- [ ] Generate button component in < 3 seconds
- [ ] 90%+ prompt parsing accuracy
- [ ] Generated code passes TypeScript validation

### Phase 2 (Week 12)
- [ ] < 200ms edit-to-preview latency
- [ ] Support 100+ components in tree
- [ ] Syntax highlighting working

### Phase 3 (Week 16)
- [ ] Heatmap renders in < 1 second
- [ ] 80%+ accuracy detecting usability issues
- [ ] AI suggestions show measurable improvement

### Phase 4 (Week 20)
- [ ] 30+ components built
- [ ] All WCAG 2.1 AA compliant
- [ ] Custom themes supported

### Phase 5 (Week 24)
- [ ] 95%+ generated code passes linting
- [ ] Deploy to Vercel in < 30 seconds
- [ ] GitHub integration working

### Phase 6 (Week 28)
- [ ] < 100ms sync latency between users
- [ ] 10+ concurrent users supported
- [ ] Zero data loss or merge conflicts

---

## 🎓 Learning Resources

### Required Reading (First Week)
1. OpenAI API Docs: https://platform.openai.com/docs
2. Zustand Guide: https://github.com/pmndrs/zustand
3. Sandpack Docs: https://sandpack.codesandbox.io/docs

### Phase-Specific
- **Phase 1:** LangChain.js agents
- **Phase 2:** Monaco API, iframe communication
- **Phase 3:** D3.js heatmaps, canvas optimization
- **Phase 4:** Design token systems
- **Phase 5:** GitHub API, Vercel API
- **Phase 6:** CRDTs, Yjs documentation

---

## 🔑 Environment Variables

```bash
# AI Providers
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...

# Optional
VITE_USE_LOCAL_LLM=false
VITE_GITHUB_CLIENT_ID=...
VITE_VERCEL_TOKEN=...
VITE_WS_SERVER_URL=ws://localhost:3001

# Feature Flags
VITE_ENABLE_VOICE_INPUT=true
VITE_ENABLE_COLLABORATION=false
VITE_ENABLE_GAZE_ANALYTICS=true
```

---

## 🎯 Daily Standup Template

**Yesterday:**
- Completed: [task from task-breakdown.md]
- Progress: [% of current phase milestone]

**Today:**
- Working on: [specific task]
- Expected completion: [hours remaining]

**Blockers:**
- [Any issues? See troubleshooting in quick-start]

**Demo:**
- [Can you show working feature?]

---

## 🚨 When You're Stuck

1. **Can't understand architecture?**
   → Read `agentic-builder-development-plan.md` Section 3

2. **Don't know what to build next?**
   → Check `task-breakdown.md` for your current phase

3. **Code not working?**
   → See troubleshooting in `implementation-quick-start.md`

4. **Lost the big picture?**
   → Review `visual-roadmap.md`

5. **Need business context?**
   → Re-read `prd.md` Section 1-2

---

## 🎉 Celebration Triggers

Celebrate when you hit these milestones:

- [ ] First successful API call to OpenAI
- [ ] First AI-generated component renders
- [ ] First heatmap displays
- [ ] First component exported to GitHub
- [ ] First real-time collaboration session
- [ ] Public launch! 🎆

---

## 📞 Who to Ask

| Question Type | Ask |
|--------------|-----|
| Architecture decisions | Engineering Lead |
| Sprint planning | Project Manager |
| Product priorities | Product Lead |
| User experience | UX Researcher |
| AI/ML questions | AI Engineer |

---

## 🔄 Quick Git Workflow

```bash
# Start new feature
git checkout -b feature/phase1-llm-client
# ... code ...
git add .
git commit -m "feat: implement OpenAI LLM client"

# Push and create PR
git push origin feature/phase1-llm-client
# Create PR, reference task-breakdown.md task number

# After review
git checkout main
git pull
```

---

## 💡 Pro Tips

1. **Read docs first, code second** - Will save hours later
2. **Start simple** - Don't try to implement streaming on day 1
3. **Test incrementally** - Don't wait till end of phase
4. **Document as you go** - Future you will thank present you
5. **Celebrate small wins** - 30-week journey needs motivation!

---

## 📱 Mobile Version

*Can't print? Save this URL:*
`/product-docs/quick-reference-card.md`

---

**Last Updated:** October 25, 2025
**Version:** 1.0
**Maintainer:** Development Team

---

*Keep building amazing things! 🚀*


