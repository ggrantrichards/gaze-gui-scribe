# ClientSight Fetch.ai Agent Backend

🤖 Multi-agent system for gaze-informed UI generation using Fetch.ai uAgents

## 🏗️ Architecture

```
React Frontend (port 5173)
        ↓
FastAPI Server (port 8000)
        ↓
   ┌────┴────┐
   ↓         ↓
Component  Gaze
Generator  Optimizer
Agent      Agent
(port 8001) (port 8002)
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

# Install packages
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy example env file
cp env.example .env

# Edit .env and add your OpenAI API key
# Get key from: https://platform.openai.com/api-keys
```

### 3. Run the Agent System

```bash
# Start all agents and API server
python main.py
```

This will start:
- ✅ FastAPI server on `http://localhost:8000`
- ✅ Component Generator Agent on port 8001
- ✅ Gaze Optimizer Agent on port 8002

### 4. Verify It's Working

Visit `http://localhost:8000` - you should see:
```json
{
  "service": "ClientSight Agent API",
  "status": "running",
  "agents": {
    "component_generator": "agent1q...",
    "gaze_optimizer": "agent1q..."
  }
}
```

Check agent status at: `http://localhost:8000/agents/status`

API docs at: `http://localhost:8000/docs`

## 📡 API Endpoints

### Generate Component
```http
POST /api/generate-component
Content-Type: application/json

{
  "prompt": "Create a modern login form",
  "gazeContext": {
    "topAttentionAreas": ["top-left", "center"],
    "avgDwellTime": 450,
    "totalFixations": 25,
    "scanpathComplexity": 150
  }
}
```

### Optimize with Gaze Data
```http
POST /api/optimize-gaze
Content-Type: application/json

{
  "componentId": "comp-123",
  "currentCode": "export function LoginForm() { ... }",
  "gazeData": [
    {"x": 500, "y": 300, "timestamp": 1234567890, "confidence": 0.9}
  ]
}
```

## 🤖 Agent Details

### Component Generator Agent
- **Port:** 8001
- **Purpose:** Generates React components from text prompts
- **Tech:** OpenAI GPT-4 + Fetch.ai uAgents
- **Unique:** Incorporates gaze context into generation prompts

### Gaze Optimizer Agent  
- **Port:** 8002
- **Purpose:** Analyzes eye-tracking data for UX insights
- **Tech:** Statistical analysis + ML patterns
- **Unique:** This is the KEY innovation for Cal Hacks!

## 🔧 Development

### Run Individual Agents (for testing)

```bash
# Component Generator only
python agents/component_generator_agent.py

# Gaze Optimizer only  
python agents/gaze_optimizer_agent.py
```

### Testing Agents

```python
from uagents.query import query
from agents.component_generator_agent import ComponentGenerationRequest

# Test component generation
request = ComponentGenerationRequest(
    prompt="Create a button",
    request_id="test-123"
)

response = await query(
    destination="agent1q...",  # Agent address
    message=request,
    timeout=30.0
)
```

## 🎯 Cal Hacks Demo Tips

### What Judges Want to See:

1. **Multi-Agent Coordination** ✅
   - Show how agents communicate
   - Demonstrate agent addresses in UI

2. **Gaze-Informed AI** ✅
   - Generate component → Track gaze → Get optimizations
   - Show heatmap data

3. **Real Fetch.ai Integration** ✅
   - Point out uAgent decorators (`@agent.on_message`)
   - Explain agent protocol

### Demo Script:

```
"Our system uses Fetch.ai's uAgents framework to create
a multi-agent system for UI generation. Watch as I type
'create a hero section'...

[Component generates]

The Component Generator agent used GPT-4 but included
gaze context in the prompt - notice it placed the CTA
button in the top-right, where our eye-tracking shows
users look most frequently.

Now as I look at this component, the Gaze Optimizer agent
is analyzing my eye movements in real-time...

[Click optimize button]

See? It detected that my attention was scattered and
recommended improving the visual hierarchy. This is unique
to ClientSight - no other tool uses real-time gaze data
to inform AI decisions!"
```

## 🐛 Troubleshooting

### "Agent did not respond"
- Check that all agents are running
- Verify ports 8000-8002 are not in use
- Check agent addresses in startup logs

### "OpenAI API error"
- Verify API key in `.env`
- Check you have credits: https://platform.openai.com/usage
- Fallback to mocks will work without API key

### "CORS errors"
- Verify frontend URL in CORS middleware matches your dev server
- Default: http://localhost:5173 (Vite)

## 📦 Deploying to Agentverse

(Coming soon - for production deployment)

```bash
# Deploy agents to Fetch.ai Agentverse
fetch deploy component_generator_agent.py
fetch deploy gaze_optimizer_agent.py
```

## 🏆 Cal Hacks Prize Eligibility

This backend qualifies for:
- ✅ **Fetch.ai Best Use** ($2,500) - Multi-agent uAgents system
- ✅ **Fetch.ai Agentverse** ($1,500) - Agent deployment
- ✅ **MLH Best AI** (Logitech Webcam) - Novel AI application

**Total: $4,200+ in prizes!**

---

Built for Cal Hacks 12.0 🎉

