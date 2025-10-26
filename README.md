# 👁️ GazeBuilder - AI-Powered UI Generation with Eye Tracking
## Cal Hacks 12.0 Project

> **🌟 Build landing pages like v0/Bolt.new, but with eye-tracking AI that optimizes based on where users actually look!**

<div align="center">

[![Fetch.ai](https://img.shields.io/badge/Fetch.ai-Multi--Agent-blue?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwIDBDNC40OCAwIDAgNC40OCAwIDEwQzAgMTUuNTIgNC40OCAyMCAxMCAyMEMxNS41MiAyMCAyMCAxNS41MiAyMCAxMEMyMCA0LjQ4IDE1LjUyIDAgMTAgMFoiIGZpbGw9IiMwMDdBRkYiLz4KPC9zdmc+Cg==)](https://fetch.ai/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-6_Models-purple?style=for-the-badge)](https://openrouter.ai/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

</div>

---

## 🎯 What Makes This Unique?

Unlike other AI UI builders (v0, Bolt.new, Lovable), **GazeBuilder uses eye-tracking** to understand where users *actually* look—not just where they click. Our AI then generates and optimizes components based on real attention patterns.

### ✨ Key Features

- 👁️ **Real-Time Eye Tracking** - WebGazer.js integration
- 🤖 **Multi-Agent AI** - Fetch.ai uAgents (Component Generator + Gaze Optimizer)
- 🌐 **6+ LLM Models** - Claude 3.5, GPT-4, Llama 3.1, Mixtral (via OpenRouter)
- 🏗️ **Full Page Builder** - Generate complete landing pages, not just components
- 🎨 **Smart Templates** - Auto-detects page type (SaaS, Portfolio, Agency, E-commerce, Blog)
- 🎯 **Gaze-Informed Suggestions** - AI suggests UX improvements based on where you look
- ⚡ **Live Preview** - Real-time component rendering
- 🔄 **Iterative Building** - Add sections one by one, like v0
- 📦 **Modern Libraries** - Shadcn/UI, Framer Motion, Lucide React out-of-the-box
- 💾 **TypeScript Export** - Download complete Next.js projects ready to deploy

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ 
- Python 3.9+
- **OpenRouter API Key** (get $5 free at [openrouter.ai](https://openrouter.ai/))

### Step 1: Clone & Install
```bash
git clone <YOUR_REPO_URL>
cd gaze-gui-scribe
npm install
```

### Step 2: Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Copy and edit .env
cp env.example .env
# Add: OPENROUTER_API_KEY=sk-or-v1-... (get from openrouter.ai)
```

### Step 3: Start Both Servers
```bash
# Terminal 1 (Backend)
cd backend
python main.py

# Terminal 2 (Frontend)
npm run dev
```

### Step 4: Open App
Visit `http://localhost:5173` 🎉

**First time?** See [OPENROUTER_SETUP.md](OPENROUTER_SETUP.md) for detailed setup.

---

## 🎬 Demo Guide (For Judges)

### **Demo 1: Simple Component** (30 seconds)
1. Press `Cmd/Ctrl + Alt + C` to open AI panel
2. Select **Llama 3.1 70B** (fast & free)
3. Type: *"A blue button with rounded corners"*
4. Click **Generate** → See instant preview!

### **Demo 2: Full Landing Page** (60 seconds)
1. Press `Cmd/Ctrl + Alt + P` to open Page Builder
2. Select **Claude 3.5 Sonnet** (best quality)
3. Type: *"A modern SaaS landing page for a project management tool"*
4. Click **Generate** → Watch AI build:
   - Navigation (sticky, responsive)
   - Hero section (gradient, CTAs)
   - Features (3 cards with icons)
   - Pricing (3 tiers)
   - Social proof (testimonials)
   - CTA section
   - Footer

### **Demo 3: Gaze Optimization** (45 seconds)
1. Look around the generated page (your eyes will be tracked)
2. Click **"Optimize with Gaze Data"** button
3. See AI suggestions like:
   - *"Users aren't scrolling - move CTA higher"*
   - *"Attention is scattered - strengthen visual hierarchy"*
   - *"Low engagement on pricing - add visual emphasis"*

---

## 🤖 AI Models (Choose Based on Need)

| Model | Best For | Speed | Quality | Cost |
|-------|----------|-------|---------|------|
| **Claude 3.5 Sonnet** | Full landing pages | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | 💰💰 |
| **GPT-4 Turbo** | Complex components | ⚡⚡ | ⭐⭐⭐⭐⭐ | 💰💰💰 |
| **Llama 3.1 70B** | Quick testing | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 🆓 FREE |
| **Mixtral 8x7B** | Balanced option | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | 💰 |

---

## 🏆 Cal Hacks 12.0 Prize Eligibility

| Track | Prize | Status |
|-------|-------|--------|
| **Fetch.ai Best Use** | $2,500 | ✅ Multi-agent system |
| **Fetch.ai Agentverse** | $1,500 | ✅ Agent deployment ready |
| **MLH Best AI** | $1,000 + Webcam | ✅ Gaze-informed AI |
| **.tech Domain** | $500 | ⏳ Register gazebuilder.tech |

**Total Value:** $5,500+ 🎉

---

## 📐 Architecture

```
┌─────────────────────────────────────────────┐
│         Frontend (React + TypeScript)        │
│  ┌─────────────────────────────────────┐   │
│  │  Eye Tracking (WebGazer.js)         │   │
│  │  - Real-time gaze capture           │   │
│  │  - Attention heatmaps               │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │  UI Components                      │   │
│  │  - Model Selector (6+ LLMs)        │   │
│  │  - Component Generation Panel       │   │
│  │  - Live Preview                     │   │
│  │  - Full Page Builder                │   │
│  └─────────────────────────────────────┘   │
└──────────────────┬──────────────────────────┘
                   │
                   │ HTTP API
                   ▼
┌─────────────────────────────────────────────┐
│       Backend (Python + FastAPI)             │
│  ┌─────────────────────────────────────┐   │
│  │  Fetch.ai Multi-Agent System        │   │
│  │  - Component Generator Agent        │   │
│  │  - Gaze Optimizer Agent             │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │  LLM Router (OpenRouter)            │   │
│  │  - Claude 3.5, GPT-4, Llama        │   │
│  │  - Auto-fallback logic              │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │  Smart Prompts                      │   │
│  │  - Page type detection              │   │
│  │  - Template selection               │   │
│  │  - Gaze context injection           │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **WebGazer.js** - Eye tracking

### Backend
- **Python 3.9+** - Runtime
- **FastAPI** - REST API
- **Fetch.ai uAgents** - Multi-agent orchestration
- **OpenRouter** - Multi-LLM access
- **Pydantic** - Data validation

### AI/ML
- **Claude 3.5 Sonnet** - Best UI generation
- **GPT-4 Turbo** - Reliable fallback
- **Llama 3.1 70B** - Fast, free option
- **Mixtral 8x7B** - Balanced choice

---

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| [OPENROUTER_SETUP.md](OPENROUTER_SETUP.md) | Setup multi-LLM access ($5 free!) |
| [ADVANCED_UI_GENERATION.md](ADVANCED_UI_GENERATION.md) | Full implementation details |
| [FETCHAI_SETUP_GUIDE.md](FETCHAI_SETUP_GUIDE.md) | Fetch.ai agent system setup |
| [PAGE_BUILDER_GUIDE.md](PAGE_BUILDER_GUIDE.md) | Page builder usage guide |
| [TESTING_GUIDE.md](TESTING_GUIDE.md) | How to test all features |

---

## 🎨 Example Prompts

### Landing Pages
```
"A modern SaaS landing page for an AI writing tool"
"Portfolio website for a UX designer with project showcase"
"E-commerce store homepage for sustainable fashion"
"Blog landing page with featured articles and newsletter"
```

### Components
```
"A pricing table with 3 tiers and feature comparison"
"Login form with email, password, and social login"
"Hero section with gradient background and two CTAs"
"Testimonial card with avatar, quote, and company logo"
```

---

## 🧪 Testing Checklist

- [ ] Eye tracking calibration works
- [ ] Model selector shows 6+ models
- [ ] Claude 3.5 generates 5+ section landing pages
- [ ] Llama 3.1 generates simple components fast
- [ ] Gaze data is captured during preview
- [ ] "Optimize with Gaze Data" shows suggestions
- [ ] All components render in live preview
- [ ] Page builder canvas displays sections

---

## 🚀 Future Enhancements

- [ ] **Image Generation** - Stability AI integration for hero images
- [ ] **Component Library** - Save & reuse generated components
- [ ] **Figma Plugin** - Import from Figma, optimize with gaze
- [ ] **Export to Next.js** - Download as Next.js project
- [ ] **Collaborative Editing** - Real-time multi-user building
- [ ] **A/B Testing** - Compare gaze patterns across designs

---

## 📄 License

MIT License - see LICENSE file

---

## 🙏 Acknowledgments

- **Fetch.ai** - Multi-agent AI framework
- **OpenRouter** - Multi-LLM gateway
- **WebGazer.js** - Open-source eye tracking
- **Cal Hacks 12.0** - Inspiration & community

---

## 📞 Contact

- **Project**: [Cal Hacks 12.0 Submission](https://calhacks.io/)
- **Demo**: [gazebuilder.tech](https://gazebuilder.tech) *(coming soon)*
- **Issues**: GitHub Issues
- **Questions**: Ask on Discord!

---

<div align="center">

**Built with ❤️ for Cal Hacks 12.0**

[⭐ Star this repo](https://github.com/your-username/gaze-gui-scribe) | [📖 Read the docs](OPENROUTER_SETUP.md) | [🎥 Watch demo](https://youtube.com)

</div>
