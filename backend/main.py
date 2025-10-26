"""
FastAPI Server - Fetch.ai Agent Coordinator
Cal Hacks 12.0 - Bridges React frontend with Fetch.ai agents

This server:
1. Receives requests from React frontend
2. Routes them to appropriate Fetch.ai agents
3. Returns responses back to frontend
"""

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict
import uuid
import asyncio
from datetime import datetime
from dotenv import load_dotenv
import json
import zipfile
import io
import os

# Load environment variables from .env file
load_dotenv()

# Fetch.ai imports
from uagents import Bureau
from uagents.query import query

# Import our agents
from agents.component_generator_agent import component_generator, ComponentGenerationRequest, ComponentGenerationResponse
from agents.gaze_optimizer_agent import gaze_optimizer, GazeOptimizationRequest, GazeOptimizationResponse

# Import new services
from prompts.typescript_prompts import get_typescript_landing_page_prompt, get_typescript_component_prompt
from services.project_builder import create_project_structure

# Create FastAPI app
app = FastAPI(
    title="ClientSight Agent API",
    description="Fetch.ai multi-agent system for gaze-informed UI generation",
    version="1.0.0"
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:3000",
        "https://clientsight-5a400.web.app",  # Firebase hosting
        "https://clientsight-5a400.firebaseapp.com",  # Firebase hosting alt
        "https://gazebuilder.tech",  # Custom domain if you have one
    ],
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
    outputFormat: Optional[str] = "vanilla"  # "vanilla" or "typescript"

class GazePointAPI(BaseModel):
    x: float
    y: float
    timestamp: int
    confidence: float

class OptimizationRequest(BaseModel):
    componentId: str
    currentCode: str
    gazeData: List[GazePointAPI]

class ProjectExportRequest(BaseModel):
    sections: List[Dict]
    projectType: str = "nextjs"  # "nextjs" or "vite"
    projectName: Optional[str] = None

class SuggestionRequest(BaseModel):
    elementType: str
    elementText: str
    elementProperties: Dict
    context: Dict
    dwellTime: float
    sectionId: str

class ApplyEditRequest(BaseModel):
    sectionId: str
    originalCode: str
    elementSelector: str
    suggestion: Dict
    customEdit: Optional[str] = None

# Agent addresses (will be populated on startup)
AGENT_ADDRESSES = {}

@app.on_event("startup")
async def startup_event():
    """Initialize Fetch.ai agents on startup"""
    print("[STARTING] Starting ClientSight Agent API...")
    print("📡 Connecting to Fetch.ai agents...")
    
    # Store agent addresses
    AGENT_ADDRESSES['component_generator'] = component_generator.address
    AGENT_ADDRESSES['gaze_optimizer'] = gaze_optimizer.address
    
    print(f"[OK] Component Generator: {component_generator.address}")
    print(f"[OK] Gaze Optimizer: {gaze_optimizer.address}")
    print("[SUCCESS] All agents ready!")

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

@app.get("/api/models")
async def get_models():
    """Get available AI models"""
    from services.openrouter_client import openrouter_client
    return openrouter_client.get_model_list()

from fastapi.responses import StreamingResponse
import json

@app.options("/api/generate-multi-section-stream")
async def generate_multi_section_stream_options():
    """Handle CORS preflight for multi-section stream endpoint"""
    return Response(status_code=200, headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    })

@app.post("/api/generate-multi-section-stream")
async def generate_multi_section_stream(request: ComponentRequest):
    """
    Generate multiple sections with real-time streaming updates
    Sends updates as each section completes
    """
    async def generate_sections_stream():
        try:
            request_id = str(uuid.uuid4())
            
            print(f"[RECEIVED] Received multi-section streaming request: {request.prompt}")
            
            # Import utilities
            from utils.section_splitter import split_into_sections
            from agents.component_generator_agent import generate_mock_component, openai_client
            from services.openrouter_client import openrouter_client
            from prompts.landing_page_prompts import get_landing_page_system_prompt, get_component_system_prompt
            from prompts.typescript_prompts import get_typescript_landing_page_prompt, get_typescript_component_prompt
            from utils.code_validator import validate_component_code, clean_and_validate_code
            
            # Analyze prompt
            analysis = split_into_sections(request.prompt)
            
            if not analysis['is_landing_page']:
                yield f"data: {json.dumps({'error': 'Not a landing page request'})}\n\n"
                return
            
            page_type = analysis['page_type']
            section_prompts = analysis['sections']
            
            # Send initial status with section names
            yield f"data: {json.dumps({'type': 'init', 'total_sections': len(section_prompts), 'section_names': [s['name'] for s in section_prompts], 'page_type': page_type})}\n\n"
            
            # Generate each section and stream updates
            for section_info in section_prompts:
                section_name = section_info['name']
                section_prompt = section_info['prompt']
                
                # Send "generating" status
                yield f"data: {json.dumps({'type': 'status', 'section': section_name, 'status': 'generating'})}\n\n"
                
                print(f"[PROCESSING] Generating {section_name}...")
                
                # Choose system prompt
                if request.outputFormat == "typescript":
                    system_prompt = get_typescript_component_prompt()
                else:
                    system_prompt = get_component_system_prompt()
                
                # Try to generate with retry logic
                code = None
                attempt = 0
                max_attempts = 3
                
                while attempt < max_attempts and not code:
                    attempt += 1
                    
                    try:
                        temp_code = await openrouter_client.generate(
                            prompt=section_prompt,
                            system_prompt=system_prompt,
                            model="auto",
                            temperature=0.7 + (attempt * 0.1),
                            max_tokens=3000  # Increased for complex sections
                        )
                        
                        is_valid, error_msg = validate_component_code(temp_code, section_name)
                        if is_valid:
                            code = temp_code
                            print(f"[OK] Generated {section_name} - Attempt {attempt} ({len(temp_code)} chars)")
                        else:
                            print(f"[WARN] Invalid code (Attempt {attempt}): {error_msg}")
                            print(f"   Code length: {len(temp_code)} chars")
                            print(f"   First 200 chars: {temp_code[:200]}")
                    except Exception as e:
                        print(f"[WARN] Generation failed (Attempt {attempt}): {e}")
                    
                    # Fallback to OpenAI if needed
                    if not code and openai_client and attempt == max_attempts:
                        try:
                            response = await openai_client.chat.completions.create(
                                model="gpt-4",
                                messages=[
                                    {"role": "system", "content": system_prompt},
                                    {"role": "user", "content": section_prompt}
                                ],
                                temperature=0.7,
                                max_tokens=3000  # Increased for complex sections
                            )
                            temp_code = response.choices[0].message.content
                            
                            is_valid, error_msg = validate_component_code(temp_code, section_name)
                            if is_valid:
                                code = temp_code
                                print(f"[OK] Generated {section_name} with GPT-4 fallback")
                        except Exception as e:
                            print(f"[WARN] OpenAI failed: {e}")
                
                # Last resort: mock or fallback
                if not code:
                    code = generate_mock_component(section_prompt)
                    print(f"[WARN] Using mock for {section_name}")
                
                # Final validation
                try:
                    code = clean_and_validate_code(code, section_name)
                except ValueError:
                    code = f"""export function {section_name.replace(' ', '')}Section() {{
  return (
    <div className="py-16 px-4 text-center bg-gray-50">
      <h2 className="text-3xl font-bold mb-4">{section_name}</h2>
      <p className="text-gray-600">Content generated successfully!</p>
    </div>
  )
}}"""
                
                # Send "completed" status with section data
                section_result = {
                    'type': 'section_complete',
                    'section': section_name,
                    'status': 'completed',
                    'data': {
                        'code': code,
                        'sectionName': section_name,
                        'componentType': section_info.get('type', 'section'),
                        'dependencies': [],
                        'sectionOrder': section_info['order'],
                        'requestId': request_id
                    }
                }
                
                yield f"data: {json.dumps(section_result)}\n\n"
                print(f"[OK] Section {section_name} complete, sent to client")
            
            # Send final completion message
            yield f"data: {json.dumps({'type': 'complete', 'message': 'All sections generated'})}\n\n"
            print(f"[SUCCESS] All sections generated and streamed")
            
        except Exception as e:
            print(f"[ERROR] Error in streaming generation: {str(e)}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        generate_sections_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

@app.options("/api/generate-multi-section")
async def generate_multi_section_options():
    """Handle CORS preflight for multi-section endpoint"""
    return Response(status_code=200, headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    })

@app.post("/api/generate-multi-section")
async def generate_multi_section(request: ComponentRequest):
    """
    Generate multiple sections for a full landing page
    Splits request into individual section prompts
    """
    try:
        request_id = str(uuid.uuid4())
        
        print(f"[RECEIVED] Received multi-section generation request: {request.prompt}")
        
        # Import utilities
        from utils.section_splitter import split_into_sections
        from agents.component_generator_agent import generate_mock_component, openai_client
        from services.openrouter_client import openrouter_client
        from prompts.landing_page_prompts import get_landing_page_system_prompt, get_component_system_prompt
        from prompts.typescript_prompts import get_typescript_landing_page_prompt, get_typescript_component_prompt
        
        # Analyze prompt and generate section prompts
        analysis = split_into_sections(request.prompt)
        
        if not analysis['is_landing_page']:
            # Single component - redirect to regular generation
            raise HTTPException(status_code=400, detail="Not a landing page request. Use /api/generate-component instead.")
        
        page_type = analysis['page_type']
        section_prompts = analysis['sections']
        
        print(f"[BUILDING] Generating {len(section_prompts)} sections for {page_type} page")
        
        # Import validation utilities
        from utils.code_validator import validate_component_code, clean_and_validate_code
        
        # Generate each section with validation and retry
        sections = []
        for section_info in section_prompts:
            section_prompt = section_info['prompt']
            section_name = section_info['name']
            
            print(f"[PROCESSING] Generating {section_name}...")
            
            # Choose system prompt based on output format
            if request.outputFormat == "typescript":
                system_prompt = get_typescript_component_prompt()
            else:
                system_prompt = get_component_system_prompt()
            
            # Try up to 3 times to generate valid code
            code = None
            attempt = 0
            max_attempts = 3
            
            while attempt < max_attempts and not code:
                attempt += 1
                
                # Try OpenRouter first (Auto-select best model)
                try:
                    temp_code = await openrouter_client.generate(
                        prompt=section_prompt,
                        system_prompt=system_prompt,
                        model="auto",  # Let OpenRouter choose the best model
                        temperature=0.7 + (attempt * 0.1),  # Increase temperature on retries
                        max_tokens=3000  # Increased for complex sections
                    )
                    
                    # Validate generated code
                    is_valid, error_msg = validate_component_code(temp_code, section_name)
                    if is_valid:
                        code = temp_code
                        print(f"[OK] Generated with OpenRouter (Auto-selected model) - Attempt {attempt}")
                    else:
                        print(f"[WARN] OpenRouter generated invalid code (Attempt {attempt}): {error_msg}")
                        if attempt < max_attempts:
                            print(f"[RETRY] Retrying {section_name} generation...")
                except Exception as e:
                    print(f"[WARN] OpenRouter failed (Attempt {attempt}): {e}")
                
                # Fallback to OpenAI GPT-4 if OpenRouter failed
                if not code and openai_client:
                    try:
                        response = await openai_client.chat.completions.create(
                            model="gpt-4",
                            messages=[
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": section_prompt}
                            ],
                            temperature=0.7 + (attempt * 0.1),
                            max_tokens=3000  # Increased for complex sections
                        )
                        temp_code = response.choices[0].message.content
                        
                        # Validate
                        is_valid, error_msg = validate_component_code(temp_code, section_name)
                        if is_valid:
                            code = temp_code
                            print(f"[OK] Generated with OpenAI GPT-4 (fallback) - Attempt {attempt}")
                        else:
                            print(f"[WARN] OpenAI generated invalid code (Attempt {attempt}): {error_msg}")
                    except Exception as e:
                        print(f"[WARN] OpenAI failed (Attempt {attempt}): {e}")
            
            # Last resort: mock generation if all attempts failed
            if not code:
                print(f"[WARN] All AI generation attempts failed for {section_name}, using mock")
                code = generate_mock_component(section_prompt)
                # Mock should always be valid, but validate anyway
                is_valid, error_msg = validate_component_code(code, section_name)
                if not is_valid:
                    print(f"[ERROR] Even mock generation failed validation: {error_msg}")
                    # Create a minimal valid component
                    code = f"""export function {section_name.replace(' ', '')}Section() {{
  return (
    <div className="py-16 px-4 text-center">
      <h2 className="text-3xl font-bold mb-4">{section_name}</h2>
      <p className="text-gray-600">This section is under construction.</p>
    </div>
  )
}}"""
            
            # Final validation and cleaning
            try:
                code = clean_and_validate_code(code, section_name)
                print(f"[OK] Section {section_name} validated ({len(code)} chars)")
            except ValueError as e:
                print(f"[ERROR] Final validation failed for {section_name}: {e}")
                # Use fallback component
                code = f"""export function {section_name.replace(' ', '')}Section() {{
  return (
    <div className="py-16 px-4 text-center bg-gray-50">
      <h2 className="text-3xl font-bold mb-4">{section_name}</h2>
      <p className="text-gray-600">Content generation in progress...</p>
    </div>
  )
}}"""
            
            section_result = {
                "code": code,
                "sectionName": section_name,
                "componentType": section_info.get('type', 'section'),
                "dependencies": [],
                "requestId": request_id
            }
            
            section_result['sectionOrder'] = section_info['order']
            
            sections.append(section_result)
            print(f"[OK] Section {section_name} complete")
        
        print(f"[SUCCESS] All {len(sections)} sections generated successfully!")
        
        return {
            "sections": sections,
            "is_multi_section": True,
            "page_type": page_type,
            "output_format": request.outputFormat
        }
        
    except Exception as e:
        print(f"[ERROR] Error in multi-section generation: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.options("/api/generate-component")
async def generate_component_options():
    """Handle CORS preflight for generate component endpoint"""
    return Response(status_code=200, headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    })

@app.post("/api/generate-component")
async def generate_component(request: ComponentRequest):
    """
    Generate a React component using Component Generator Agent
    Now with OpenRouter support and TypeScript output!
    """
    try:
        request_id = str(uuid.uuid4())
        
        print(f"[RECEIVED] Received generation request: {request.prompt}")
        
        # Import generation logic
        from agents.component_generator_agent import generate_mock_component, extract_dependencies, detect_component_type, openai_client
        from services.openrouter_client import openrouter_client
        from prompts.landing_page_prompts import get_landing_page_system_prompt, get_component_system_prompt, detect_page_type
        from prompts.typescript_prompts import get_typescript_landing_page_prompt, get_typescript_component_prompt
        
        # Detect if this is a full page or single component
        is_landing_page = any(keyword in request.prompt.lower() for keyword in [
            'landing page', 'full page', 'complete page', 'entire page', 
            'website', 'web page', 'full site', 'complete site'
        ])
        
        # Choose appropriate system prompt based on output format
        if request.outputFormat == "typescript":
            if is_landing_page:
                page_type = detect_page_type(request.prompt)
                system_prompt = get_typescript_landing_page_prompt(page_type)
            else:
                system_prompt = get_typescript_component_prompt()
        else:
            if is_landing_page:
                page_type = detect_page_type(request.prompt)
                system_prompt = get_landing_page_system_prompt(page_type)
            else:
                system_prompt = get_component_system_prompt()
        
        print(f"🎨 Output format: {request.outputFormat}")
        print(f"📄 Page type: {'Landing Page' if is_landing_page else 'Single Component'}")
        
        # Try OpenRouter (Auto-select best model) first
        code = None
        try:
            code = await openrouter_client.generate(
                prompt=request.prompt,
                system_prompt=system_prompt,
                model="auto"  # Let OpenRouter choose the best model
            )
            print("[OK] Generated with OpenRouter (Auto-selected model)")
        except Exception as e:
            print(f"[WARN] OpenRouter failed: {e}")
        
        # Fallback to OpenAI GPT-4
        if not code and openai_client:
            try:
                response = await openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": request.prompt}
                    ],
                    temperature=0.7,
                    max_tokens=3000
                )
                code = response.choices[0].message.content
                print("[OK] Generated with OpenAI GPT-4 (fallback)")
            except Exception as e:
                print(f"[WARN] OpenAI failed: {e}")
        
        # Last resort: mock generation
        if not code:
            code = generate_mock_component(request.prompt)
            print("[OK] Generated with mock fallback")
        
        # Extract component metadata
        dependencies = extract_dependencies(code)
        component_type = detect_component_type(request.prompt)
        
        return {
            "requestId": request_id,
            "code": code,
            "componentType": component_type,
            "dependencies": dependencies,
            "success": True,
            "output_format": request.outputFormat
        }
        
    except Exception as e:
        print(f"[ERROR] Error generating component: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.options("/api/export-project")
async def export_project_options():
    """Handle CORS preflight for export project endpoint"""
    return Response(status_code=200, headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    })

@app.post("/api/export-project")
async def export_project(request: ProjectExportRequest):
    """
    Export generated components as a complete TypeScript project
    Returns a downloadable ZIP file
    """
    try:
        print(f"📦 Exporting project...")
        print(f"   Type: {request.projectType}")
        print(f"   Sections: {len(request.sections)}")
        
        # Create project structure
        project_data = create_project_structure(
            components=request.sections,
            project_type=request.projectType
        )
        
        project_name = request.projectName or project_data['project_name']
        files = project_data['files']
        
        # Create ZIP file in memory
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file_path, content in files.items():
                # Handle different content types
                if isinstance(content, dict):
                    # JSON files
                    content_str = json.dumps(content, indent=2)
                elif isinstance(content, str):
                    content_str = content
                else:
                    content_str = str(content)
                
                # Add file to ZIP
                zip_file.writestr(f"{project_name}/{file_path}", content_str)
        
        zip_buffer.seek(0)
        
        print(f"[OK] Project exported: {project_name}.zip")
        
        # Return ZIP file
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename={project_name}.zip"
            }
        )
        
    except Exception as e:
        print(f"[ERROR] Error exporting project: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.options("/api/optimize-with-gaze")
async def optimize_with_gaze_options():
    """Handle CORS preflight for optimize with gaze endpoint"""
    return Response(status_code=200, headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    })

@app.post("/api/optimize-with-gaze")
async def optimize_with_gaze(request: OptimizationRequest):
    """
    Optimize a component using gaze data via Gaze Optimizer Agent
    """
    try:
        request_id = str(uuid.uuid4())
        
        print(f"[STATS] Received optimization request for component: {request.componentId}")
        print(f"   Gaze points: {len(request.gazeData)}")
        
        # Direct agent logic call (simplified for demo)
        from agents.gaze_optimizer_agent import analyze_gaze_data, generate_optimization_suggestions, openai_client
        
        # Analyze gaze data
        gaze_analysis = analyze_gaze_data([{
            'x': p.x,
            'y': p.y,
            'timestamp': p.timestamp,
            'confidence': p.confidence
        } for p in request.gazeData])
        
        # Generate suggestions using OpenAI
        suggestions = generate_optimization_suggestions(
            component_code=request.currentCode,
            gaze_analysis=gaze_analysis
        )
        
        return {
            "requestId": request_id,
            "componentId": request.componentId,
            "gazeMetrics": gaze_analysis,
            "suggestions": suggestions,
            "success": True
        }
        
    except Exception as e:
        print(f"[ERROR] Error optimizing component: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.options("/api/generate-suggestions")
async def generate_suggestions_options():
    """Handle CORS preflight for generate suggestions endpoint"""
    return Response(status_code=200, headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    })

@app.post("/api/generate-suggestions")
async def generate_suggestions(request: SuggestionRequest):
    """
    Generate AI-powered suggestions for a component based on gaze dwell
    This is the CORE FEATURE - suggesting improvements based on where users look
    """
    try:
        request_id = str(uuid.uuid4())
        
        print(f"[GAZE-SUGGESTIONS] Generating suggestions for {request.elementType}")
        print(f"   Element text: '{request.elementText[:50]}...'")
        print(f"   Dwell time: {request.dwellTime:.2f}s")
        
        from services.suggestion_generator import generate_suggestions as gen_suggestions
        
        suggestions = await gen_suggestions(
            element_type=request.elementType,
            element_text=request.elementText,
            element_properties=request.elementProperties,
            context=request.context,
            dwell_time=request.dwellTime
        )
        
        print(f"[SUCCESS] Generated {len(suggestions)} suggestions")
        
        return {
            "requestId": request_id,
            "sectionId": request.sectionId,
            "suggestions": suggestions,
            "dwellTime": request.dwellTime,
            "success": True
        }
        
    except Exception as e:
        print(f"[ERROR] Error generating suggestions: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.options("/api/apply-edit")
async def apply_edit_options():
    """Handle CORS preflight for apply edit endpoint"""
    return Response(status_code=200, headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    })

@app.post("/api/apply-edit")
async def apply_edit(request: ApplyEditRequest):
    """
    Apply a suggested edit to a component's code
    Handles both AI suggestions and custom text edits
    """
    try:
        request_id = str(uuid.uuid4())
        
        print(f"[APPLY-EDIT] Applying edit to section {request.sectionId}")
        
        from services.suggestion_generator import apply_suggestion_to_code
        
        if request.customEdit:
            # Handle custom text edit
            print(f"   Custom edit: '{request.customEdit}'")
            
            # Use AI to interpret and apply custom edit
            from agents.component_generator_agent import openai_client
            
            if openai_client:
                prompt = f"""Modify this React component based on the user's instruction: "{request.customEdit}"

Original Component:
```jsx
{request.originalCode}
```

Target element: {request.elementSelector}

Apply the requested change and return ONLY the modified component code, no explanations."""

                response = await openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": "You are a React expert. Return only code."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=2000
                )
                
                modified_code = response.choices[0].message.content.strip()
                
                # Clean code fences
                if modified_code.startswith("```"):
                    lines = modified_code.split("\n")
                    modified_code = "\n".join(lines[1:-1])
            else:
                modified_code = request.originalCode
        else:
            # Apply AI-generated suggestion
            print(f"   Suggestion: {request.suggestion.get('title')}")
            
            modified_code = await apply_suggestion_to_code(
                original_code=request.originalCode,
                element_selector=request.elementSelector,
                suggestion=request.suggestion
            )
        
        print("[SUCCESS] Edit applied successfully")
        
        return {
            "requestId": request_id,
            "sectionId": request.sectionId,
            "modifiedCode": modified_code,
            "success": True
        }
        
    except Exception as e:
        print(f"[ERROR] Error applying edit: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
