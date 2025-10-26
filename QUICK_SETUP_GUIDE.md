# ⚡ Quick Setup Guide - 5 Minutes to Demo-Ready

## 🎯 Goal
Get GazeBuilder running with full AI capabilities in 5 minutes.

---

## Step 1: Get OpenRouter API Key (2 minutes)

1. Go to [openrouter.ai](https://openrouter.ai/)
2. Click **Sign Up** (free)
3. Verify email
4. Get **$5 free credit** automatically
5. Go to [Keys page](https://openrouter.ai/keys)
6. Click **Create Key**
7. Copy the key (starts with `sk-or-v1-...`)

**Why OpenRouter?**
- $5 free credit = ~1,000 landing pages
- Access to Claude 3.5 (best UI generation)
- Llama 3.1 is totally free
- Single API for 100+ models

---

## Step 2: Clone & Install (1 minute)

```bash
# Clone
git clone <YOUR_REPO_URL>
cd gaze-gui-scribe

# Install frontend
npm install

# Install backend
cd backend
pip install -r requirements.txt
```

---

## Step 3: Configure Environment (30 seconds)

```bash
# Still in backend/
cp env.example .env
```

Edit `.env` and add your key:
```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

**That's it!** OpenAI API key is optional (OpenRouter is better).

---

## Step 4: Start Servers (30 seconds)

### Terminal 1 (Backend):
```bash
cd backend
python main.py
```

**Look for:**
```
✅ OpenRouter API key found
🎉 All agents ready!
```

### Terminal 2 (Frontend):
```bash
npm run dev
```

---

## Step 5: Test It! (1 minute)

### Open http://localhost:5173

### Test 1: Simple Component (Free & Fast)
1. Press `Cmd/Ctrl + Alt + C`
2. Select **Llama 3.1 70B** (free)
3. Type: *"A blue button"*
4. Click **Generate**
5. ✅ Should generate in ~3 seconds

### Test 2: Full Landing Page (Best Quality)
1. Still in AI panel
2. Select **Claude 3.5 Sonnet**
3. Type: *"A modern SaaS landing page"*
4. Click **Generate**
5. ✅ Should generate 5+ sections in ~10 seconds

---

## 🎉 You're Ready!

### What You Have Now:
- ✅ Eye tracking working
- ✅ 6+ AI models available
- ✅ Full landing page generation
- ✅ Component generation
- ✅ Gaze optimization
- ✅ Live preview

---

## 🐛 Troubleshooting

### "OpenRouter API not available"
**Fix:** Check `backend/.env` has `OPENROUTER_API_KEY=sk-or-v1-...`

### "Module not found"
**Fix:** Run `pip install -r requirements.txt` in backend/

### Models not showing
**Fix:** Backend must be running (`python main.py` in backend/)

### Preview is blank
**Fix:** Check browser console, try different model

---

## 🎯 Cal Hacks Demo Tips

1. **Start with Llama** (fast, impresses judges)
2. **Switch to Claude** (show quality difference)
3. **Generate full page** (hero + features + pricing)
4. **Show gaze tracking** (unique differentiator!)
5. **Click "Optimize"** (AI suggestions based on gaze)

**Demo Time:** 3-5 minutes total

---

## 📚 Next Steps

- Read [OPENROUTER_SETUP.md](OPENROUTER_SETUP.md) for detailed info
- Read [ADVANCED_UI_GENERATION.md](ADVANCED_UI_GENERATION.md) for architecture
- Read [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for testing

---

## 💡 Pro Tips

1. **Practice the demo 3x** before presenting
2. **Use Claude 3.5 for judges** (best quality)
3. **Use Llama for testing** (free, unlimited)
4. **Compare models** (shows you integrated multiple LLMs)
5. **Emphasize gaze tracking** (no one else has this!)

---

## 🏆 Prize Targets

- **Fetch.ai:** $2,500 (multi-agent system ✅)
- **Fetch.ai Agentverse:** $1,500 (agents ready ✅)
- **MLH Best AI:** $1,000 (gaze-informed AI ✅)
- **.tech Domain:** $500 (register gazebuilder.tech)

**Total:** $5,500+ 🎉

---

## 🚀 You're All Set!

Open http://localhost:5173 and start building! 🎨

Good luck at Cal Hacks! 🎉

