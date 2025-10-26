"""
FastAPI Server - Fetch.ai Agent Coordinator
Cal Hacks 12.0 - Bridges React frontend with Fetch.ai agents

This server:
1. Receives requests from React frontend
2. Routes them to appropriate Fetch.ai agents
3. Returns responses back to frontend
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import uuid
import asyncio
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Fetch.ai imports
from uagents import Bureau
from uagents.query import query

# Import our agents
from agents.component_generator_agent import component_generator, ComponentGenerationRequest, ComponentGenerationResponse
from agents.gaze_optimizer_agent import gaze_optimizer, GazeOptimizationRequest, GazeOptimizationResponse

# Create FastAPI app
app = FastAPI(
    title="ClientSight Agent API",
    description="Fetch.ai multi-agent system for gaze-informed UI generation",
    version="1.0.0"
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Models (match frontend TypeScript types)
class GazeContext(BaseModel):
    topAttentionAreas: List[str]
    avgDwellTime: float
    totalFixations: int
    scanpathComplexity: float

class ComponentRequest(BaseModel):
    prompt: str
    gazeContext: Optional[GazeContext] = None
    designTokens: Optional[Dict] = None
    constraints: Optional[List[str]] = None

class GazePointAPI(BaseModel):
    x: float
    y: float
    timestamp: int
    confidence: float

class OptimizationRequest(BaseModel):
    componentId: str
    currentCode: str
    gazeData: List[GazePointAPI]

# Agent addresses (will be populated on startup)
AGENT_ADDRESSES = {}

@app.on_event("startup")
async def startup_event():
    """Initialize Fetch.ai agents on startup"""
    print("🚀 Starting ClientSight Agent API...")
    print("📡 Connecting to Fetch.ai agents...")
    
    # Store agent addresses
    AGENT_ADDRESSES['component_generator'] = component_generator.address
    AGENT_ADDRESSES['gaze_optimizer'] = gaze_optimizer.address
    
    print(f"✅ Component Generator: {component_generator.address}")
    print(f"✅ Gaze Optimizer: {gaze_optimizer.address}")
    print("🎉 All agents ready!")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "ClientSight Agent API",
        "status": "running",
        "agents": {
            "component_generator": AGENT_ADDRESSES.get('component_generator'),
            "gaze_optimizer": AGENT_ADDRESSES.get('gaze_optimizer')
        },
        "timestamp": datetime.now().isoformat()
    }

@app.get("/agents/status")
async def get_agents_status():
    """Get status of all agents"""
    return {
        "agents": [
            {
                "name": "Component Generator",
                "type": "component-generator",
                "address": AGENT_ADDRESSES.get('component_generator'),
                "status": "idle",
                "endpoint": "http://localhost:8001"
            },
            {
                "name": "Gaze Optimizer",
                "type": "gaze-optimizer",
                "address": AGENT_ADDRESSES.get('gaze_optimizer'),
                "status": "idle",
                "endpoint": "http://localhost:8002"
            }
        ]
    }

@app.post("/api/generate-component")
async def generate_component(request: ComponentRequest):
    """
    Generate a React component using Component Generator Agent
    
    For Cal Hacks demo: Direct function call (simpler than agent query)
    For production: Would use Fetch.ai agent network
    """
    try:
        request_id = str(uuid.uuid4())
        
        print(f"📨 Received generation request: {request.prompt}")
        
        # Import the generation logic directly
        from agents.component_generator_agent import build_system_prompt, generate_mock_component, extract_dependencies, detect_component_type, openai_client
        
        # Convert frontend format to dict
        gaze_context_dict = None
        if request.gazeContext:
            gaze_context_dict = {
                'topAttentionAreas': request.gazeContext.topAttentionAreas,
                'avgDwellTime': request.gazeContext.avgDwellTime,
                'totalFixations': request.gazeContext.totalFixations,
                'scanpathComplexity': request.gazeContext.scanpathComplexity
            }
        
        # Generate component (direct call for demo)
        print(f"🤖 Generating component...")
        
        if openai_client is None:
            print("⚠️  Using mock generation")
            code = generate_mock_component(request.prompt)
        else:
            print("🧠 Using OpenAI GPT-4...")
            # Create a simple request object
            class SimpleRequest:
                def __init__(self):
                    self.prompt = request.prompt
                    self.gazeContext = gaze_context_dict
                    self.designTokens = request.designTokens
                    self.constraints = request.constraints
            
            req = SimpleRequest()
            req.prompt = request.prompt
            req.gaze_context = gaze_context_dict
            req.design_tokens = request.designTokens
            req.constraints = request.constraints
            
            system_prompt = build_system_prompt(req)
            
            response = await openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": request.prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            code = response.choices[0].message.content
            
            # Extract code from markdown if wrapped
            if "```" in code:
                import re
                match = re.search(r'```(?:tsx?|jsx?)?\n(.*?)```', code, re.DOTALL)
                code = match.group(1).strip() if match else code.strip()
        
        dependencies = extract_dependencies(code)
        component_type = detect_component_type(code)
        
        print(f"✅ Component generated: {component_type}")
        
        return {
            "code": code,
            "explanation": f"Generated {component_type} component",
            "dependencies": dependencies,
            "componentType": component_type,
            "confidence": 0.9 if openai_client else 0.7,
            "gazeOptimizations": None,
            "agentAddress": AGENT_ADDRESSES['component_generator']
        }
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/optimize-gaze")
async def optimize_with_gaze(request: OptimizationRequest):
    """
    Optimize component based on gaze data using Gaze Optimizer Agent
    
    This is the UNIQUE VALUE PROP that wins Cal Hacks prizes!
    """
    try:
        request_id = str(uuid.uuid4())
        
        print(f"👁️  Received optimization request for {request.componentId}")
        print(f"📊 Analyzing {len(request.gazeData)} gaze points")
        
        # Convert gaze data to agent format
        from agents.gaze_optimizer_agent import GazePoint
        gaze_points = [
            GazePoint(
                x=point.x,
                y=point.y,
                timestamp=point.timestamp,
                confidence=point.confidence
            )
            for point in request.gazeData
        ]
        
        # Create agent request
        agent_request = GazeOptimizationRequest(
            request_id=request_id,
            component_id=request.componentId,
            current_code=request.currentCode,
            gaze_data=gaze_points
        )
        
        # Query the agent
        print(f"🤖 Querying Gaze Optimizer agent...")
        response = await query(
            destination=AGENT_ADDRESSES['gaze_optimizer'],
            message=agent_request,
            timeout=30.0
        )
        
        if response and isinstance(response, GazeOptimizationResponse):
            print(f"✅ Found {len(response.suggestions)} optimizations")
            
            # Convert to frontend format
            suggestions = [
                {
                    "issue": s.issue,
                    "recommendation": s.recommendation,
                    "code": s.code,
                    "estimatedImpact": s.estimated_impact,
                    "severity": s.severity
                }
                for s in response.suggestions
            ]
            
            return {
                "suggestions": suggestions,
                "predictedImpact": response.predicted_impact,
                "priority": response.priority,
                "heatmapZones": response.heatmap_zones,
                "agentAddress": AGENT_ADDRESSES['gaze_optimizer']
            }
        else:
            raise HTTPException(status_code=500, detail="Agent did not respond")
        
    except asyncio.TimeoutError:
        print("⏰ Agent request timed out")
        raise HTTPException(status_code=504, detail="Agent request timed out")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Run agents in background
bureau = Bureau(port=8000)
bureau.add(component_generator)
bureau.add(gaze_optimizer)

if __name__ == "__main__":
    import uvicorn
    
    # Start FastAPI server
    print("🚀 Starting FastAPI server on http://localhost:8000")
    print("📚 API docs: http://localhost:8000/docs")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

