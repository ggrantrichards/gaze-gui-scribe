# 🌐 OpenRouter Integration Guide

## What is OpenRouter?

OpenRouter provides a unified API to access multiple LLMs (Large Language Models):
- **Claude 3.5 Sonnet** (Best for UI/UX design)
- **GPT-4 Turbo/4o** (Reliable, well-rounded)
- **Llama 3.1 70B** (Fast, free tier)
- **Mixtral 8x7B** (Balanced speed/quality)
- And 100+ more models!

### Why Use OpenRouter?

1. **$5 Free Credit** for new users
2. **Single API** for multiple models
3. **Lower costs** than direct OpenAI
4. **Better UI generation** with Claude 3.5
5. **Fallback options** if one model is down

---

## 🚀 Setup Instructions

### Step 1: Get Your API Key

1. Go to [OpenRouter.ai](https://openrouter.ai/)
2. Sign up (free)
3. Get **$5 free credit** automatically
4. Go to [Keys](https://openrouter.ai/keys)
5. Create a new API key

### Step 2: Add to Backend `.env`

```bash
cd backend
```

Edit `.env` file (or create from `.env.example`):

```env
# OpenRouter API Key (RECOMMENDED)
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# OpenAI API Key (Fallback)
OPENAI_API_KEY=sk-proj-your-key-here
```

### Step 3: Restart Backend

```bash
# Kill existing backend (Ctrl+C)
python main.py
```

You should see:
```
✅ OpenRouter API key found
```

---

## 🎯 How It Works

### Model Priority (Automatic Fallback)

```
1. OpenRouter (Claude 3.5) ← Best quality, try first
2. OpenAI (GPT-4)           ← Good fallback
3. Mock Generation          ← Last resort (no API key)
```

### Model Selection in UI

1. Open **AI Component Generator** panel
2. Click **AI Model** dropdown
3. Choose your model:
   - **Claude 3.5 Sonnet** ⚡💰 - Best for landing pages (recommended)
   - **GPT-4 Turbo** ⏱️💎 - Reliable components
   - **Llama 3.1 70B** ⚡🆓 - Fast & free
   - **Mixtral 8x7B** ⚡💵 - Good balance

### Prompt Examples

#### Full Landing Page (Use Claude 3.5!)
```
Create a modern SaaS landing page with:
- Hero section with gradient
- 3 feature cards
- Pricing table (3 tiers)
- Customer testimonials
- CTA section
- Footer with links
```

#### Component
```
A minimalist login form with:
- Email and password inputs
- Remember me checkbox
- Forgot password link
- Social login buttons (Google, GitHub)
- Modern glassmorphism design
```

---

## 💰 Pricing

| Model | Cost per 1M tokens | Quality | Speed |
|-------|-------------------|---------|-------|
| Claude 3.5 Sonnet | $3 / $15 | ⭐⭐⭐⭐⭐ | ⚡⚡⚡ |
| GPT-4 Turbo | $10 / $30 | ⭐⭐⭐⭐⭐ | ⚡⚡ |
| Llama 3.1 70B | FREE | ⭐⭐⭐⭐ | ⚡⚡⚡⚡ |
| Mixtral 8x7B | $0.24 / $0.24 | ⭐⭐⭐⭐ | ⚡⚡⚡⚡⚡ |

> **$5 free credit** = ~1,000 landing pages with Llama or ~50 with Claude!

---

## 🧪 Testing

### Test 1: Simple Component
```
Prompt: "A blue button with rounded corners"
Expected: ✅ Fast generation (< 5 sec)
```

### Test 2: Full Landing Page
```
Prompt: "A complete SaaS landing page with all sections"
Expected: ✅ 5+ sections (nav, hero, features, pricing, footer)
```

### Test 3: Model Comparison
1. Generate same prompt with **Llama 3.1** (fast)
2. Generate same prompt with **Claude 3.5** (best quality)
3. Compare output quality!

---

## 🐛 Troubleshooting

### "OpenRouter API not available"
- ✅ Check `.env` file in `backend/` folder
- ✅ Restart backend server (`python main.py`)
- ✅ Verify API key starts with `sk-or-v1-`

### "Rate limit exceeded"
- You've used your $5 credit
- Add more credit at [OpenRouter.ai/account](https://openrouter.ai/account)
- OR use fallback models (Llama is free!)

### "Model not found"
- Check [OpenRouter Models](https://openrouter.ai/models) for current model IDs
- Update `backend/services/openrouter_client.py` MODELS dict

---

## 📊 Monitoring Usage

View your usage at [OpenRouter Dashboard](https://openrouter.ai/activity):
- See cost per request
- Track which models you're using
- Monitor remaining credit

---

## 🎉 Cal Hacks Benefits

1. **Better Demos**: Claude 3.5 generates MUCH better landing pages
2. **Multiple Models**: Show judges you integrated diverse AI
3. **Free Tier**: Llama 3.1 for unlimited testing
4. **Sponsor Eligibility**: OpenRouter counts as AI integration
5. **Fallbacks**: Demo won't break if one API fails

---

## 📚 Resources

- **OpenRouter Docs**: https://openrouter.ai/docs
- **Model Comparison**: https://openrouter.ai/models
- **Discord Support**: https://discord.gg/openrouter
- **Pricing Calculator**: https://openrouter.ai/models (see cost column)

---

## Next Steps

1. ✅ Add `OPENROUTER_API_KEY` to `backend/.env`
2. ✅ Restart backend
3. ✅ Try generating a full landing page
4. ✅ Compare Claude 3.5 vs Llama quality
5. ✅ Show judges the model selector during demo!

**Pro Tip**: Use Claude 3.5 for Cal Hacks demo presentations, Llama for testing! 🚀

