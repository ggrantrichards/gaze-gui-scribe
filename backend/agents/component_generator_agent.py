"""
Component Generator Agent - Fetch.ai uAgent
Cal Hacks 12.0 - $4,000 in prizes

This agent generates React components from natural language prompts.
Uses OpenAI GPT-4 for intelligent component generation.
"""

from uagents import Agent, Context, Model
from typing import Optional, List, Dict
import os
import json
from openai import AsyncOpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Message Models for Fetch.ai protocol
class ComponentGenerationRequest(Model):
    """Request to generate a React component"""
    prompt: str
    gaze_context: Optional[Dict] = None
    design_tokens: Optional[Dict] = None
    constraints: Optional[List[str]] = None
    request_id: str

class ComponentGenerationResponse(Model):
    """Response with generated component code"""
    request_id: str
    code: str
    explanation: str
    dependencies: List[str]
    component_type: str
    confidence: float
    gaze_optimizations: Optional[List[str]] = None
    error: Optional[str] = None

# Initialize OpenAI client (optional - will use mocks if not available)
openai_api_key = os.getenv("OPENAI_API_KEY")
if openai_api_key:
    print("[OK] OpenAI API key found and loaded")
    openai_client = AsyncOpenAI(api_key=openai_api_key)
else:
    print("[WARN] No OpenAI API key found - will use mock generation")
    openai_client = None

# Create Component Generator Agent
# For cloud deployment: agents communicate via Bureau internally, no separate HTTP endpoints needed
# In Railway, we only expose the FastAPI server on PORT, agents communicate via Bureau
component_generator = Agent(
    name="component_generator",
    port=8001,  # Internal port for Bureau communication
    seed="component_generator_seed_phrase_calhacks",
    # Endpoint only needed if agent needs to be accessed externally
    # For Railway, Bureau handles internal communication
)

@component_generator.on_event("startup")
async def introduce(ctx: Context):
    """Announce agent on startup"""
    ctx.logger.info(f"[AI] Component Generator Agent started")
    ctx.logger.info(f"📍 Address: {component_generator.address}")
    ctx.logger.info(f"🔌 Running via Bureau (internal communication)")

@component_generator.on_message(model=ComponentGenerationRequest)
async def handle_generation_request(ctx: Context, sender: str, msg: ComponentGenerationRequest):
    """
    Handle component generation requests
    
    This is the CORE AGENT LOGIC that judges will evaluate!
    """
    ctx.logger.info(f"[RECEIVED] Received request from {sender}: {msg.prompt}")
    
    try:
        # Check if OpenAI is available
        if openai_client is None:
            ctx.logger.info("[WARN]  No OpenAI API key - using mock generation")
            code = generate_mock_component(msg.prompt)
            dependencies = extract_dependencies(code)
            component_type = detect_component_type(code)
        else:
            # Build system prompt with gaze context
            system_prompt = build_system_prompt(msg)
            
            # Call OpenAI GPT-4 for intelligent generation
            ctx.logger.info("🧠 Calling OpenAI GPT-4...")
            
            response = await openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": msg.prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            code = response.choices[0].message.content
            
            # Extract code from markdown if wrapped
            if "```" in code:
                code = extract_code_block(code)
            
            # Analyze the generated code
            dependencies = extract_dependencies(code)
            component_type = detect_component_type(code)
        
        # Build response
        response_msg = ComponentGenerationResponse(
            request_id=msg.request_id,
            code=code,
            explanation=f"Generated {component_type} component from prompt",
            dependencies=dependencies,
            component_type=component_type,
            confidence=0.9,
            gaze_optimizations=build_gaze_optimizations(msg.gaze_context) if msg.gaze_context else None
        )
        
        ctx.logger.info(f"[OK] Generated {component_type} successfully")
        
    except Exception as e:
        ctx.logger.error(f"[ERROR] Generation failed: {str(e)}")
        response_msg = ComponentGenerationResponse(
            request_id=msg.request_id,
            code="",
            explanation="",
            dependencies=[],
            component_type="Error",
            confidence=0.0,
            error=str(e)
        )
    
    # Send response back to requester
    await ctx.send(sender, response_msg)

def build_system_prompt(request: ComponentGenerationRequest) -> str:
    """Build intelligent system prompt with gaze insights"""
    
    base_prompt = """You are an expert React developer specialized in creating production-ready components.

Generate a React component using:
- VANILLA REACT ONLY (React 18 via CDN - no Next.js, no Vite, no framework-specific imports)
- Tailwind CSS for styling (via CDN)
- Functional components with React hooks (useState, useEffect, etc.)
- WCAG 2.1 AA accessibility standards
- Responsive design (mobile-first)
- Clean, well-documented code

CRITICAL RULES:
1. NO import statements - React is available globally as `React`
2. NO Next.js components (Image, Link, etc.) - use standard HTML elements (<img>, <a>)
3. NO external package imports - only use React built-in hooks
4. Use React.useState NOT import { useState } - hooks are on React object
5. Export as: export function ComponentName() { ... }
6. For images: use <img src="..."> NOT <Image>
7. For links: use <a href="..."> NOT <Link>
8. Component must be self-contained and work in browser via CDN

GOOD EXAMPLE:
export function HeroSection() {
  const [email, setEmail] = React.useState('');
  return (
    <section className="bg-gradient-to-r from-blue-500 to-purple-600 py-20">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-5xl font-bold text-white mb-6">Welcome</h1>
        <img src="https://via.placeholder.com/400" alt="Hero" className="rounded-lg" />
      </div>
    </section>
  );
}

BAD EXAMPLE (DO NOT DO THIS):
import Image from 'next/image'  [ERROR] NO IMPORTS
import { useState } from 'react'  [ERROR] NO IMPORTS
<Image src="..." />  [ERROR] Use <img> instead

IMPORTANT: Return ONLY the component code, no explanations or markdown."""

    # Add design tokens if provided
    if request.design_tokens:
        base_prompt += f"\n\nDesign System:\n{json.dumps(request.design_tokens, indent=2)}"
    
    # Add gaze context for UX optimization
    if request.gaze_context:
        base_prompt += f"""

[TARGET] USER ATTENTION INSIGHTS (from eye-tracking):
- Primary attention areas: {', '.join(request.gaze_context.get('topAttentionAreas', []))}
- Average dwell time: {request.gaze_context.get('avgDwellTime', 0)}ms
- Total fixations: {request.gaze_context.get('totalFixations', 0)}
- Scanpath complexity: {request.gaze_context.get('scanpathComplexity', 0)}

OPTIMIZE the component layout to:
1. Place important elements in high-attention areas
2. Use visual hierarchy to guide eye movement
3. Minimize cognitive load based on scanpath data
"""
    
    # Add constraints
    if request.constraints:
        base_prompt += f"\n\nConstraints:\n" + "\n".join(f"- {c}" for c in request.constraints)
    
    return base_prompt

def extract_code_block(text: str) -> str:
    """Extract code from markdown code blocks"""
    import re
    match = re.search(r'```(?:tsx?|jsx?)?\n(.*?)```', text, re.DOTALL)
    return match.group(1).strip() if match else text.strip()

def extract_dependencies(code: str) -> List[str]:
    """Extract npm dependencies from import statements"""
    import re
    imports = re.findall(r'import .* from [\'"]([^\'"]+)[\'"]', code)
    return [imp for imp in imports if not imp.startswith('.') and not imp.startswith('@/')]

def detect_component_type(code: str) -> str:
    """Detect component name from code"""
    import re
    match = re.search(r'(?:export\s+)?(?:function|const)\s+(\w+)', code)
    return match.group(1) if match else 'Component'

def build_gaze_optimizations(gaze_context: Dict) -> List[str]:
    """Generate optimization suggestions based on gaze data"""
    optimizations = []
    
    top_areas = gaze_context.get('topAttentionAreas', [])
    if 'top-left' in top_areas:
        optimizations.append("Logo/branding placed in top-left for natural attention flow")
    if 'top-right' in top_areas:
        optimizations.append("Action buttons positioned in top-right high-attention zone")
    
    avg_dwell = gaze_context.get('avgDwellTime', 0)
    if avg_dwell < 200:
        optimizations.append("Simplified layout for quick scanning (low dwell time detected)")
    elif avg_dwell > 500:
        optimizations.append("Detailed content supported (high engagement detected)")
    
    return optimizations

def generate_mock_component(prompt: str) -> str:
    """Generate mock component when OpenAI API is not available"""
    prompt_lower = prompt.lower()
    
    # Full landing page / web app
    if any(word in prompt_lower for word in ['landing page', 'website', 'web app', 'homepage', 'full page']):
        return '''export function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">YourBrand</div>
          <div className="flex gap-6">
            <a href="#features" className="text-gray-600 hover:text-blue-600">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-blue-600">Pricing</a>
            <a href="#contact" className="text-gray-600 hover:text-blue-600">Contact</a>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Build Amazing Products
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The platform that helps you create, ship, and scale your ideas faster than ever before.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold">
              Start Free Trial
            </button>
            <button className="bg-white hover:bg-gray-50 text-gray-800 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-gray-300">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Powerful Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
              <p className="text-gray-600">Built for speed with cutting-edge technology</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold mb-2">Secure</h3>
              <p className="text-gray-600">Enterprise-grade security built in</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-bold mb-2">Scalable</h3>
              <p className="text-gray-600">Grows with your business needs</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of teams building better products</p>
          <button className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold">
            Start Your Free Trial
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2024 YourBrand. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}'''
    
    # Button
    if 'button' in prompt_lower:
        return '''export function Button() {
  return (
    <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
      Click Me
    </button>
  )
}'''
    
    # Form / Login
    if 'form' in prompt_lower or 'login' in prompt_lower:
        return '''export function LoginForm() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Login:', { email, password })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Login</h2>
      
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div className="mb-6">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        Sign In
      </button>
    </form>
  )
}'''
    
    # Card
    if 'card' in prompt_lower:
        return '''export function Card() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow max-w-sm">
      <img
        src="https://via.placeholder.com/400x200"
        alt="Card image"
        className="w-full h-48 object-cover"
      />
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2 text-gray-900">Card Title</h3>
        <p className="text-gray-600 mb-4">This is a card component with an image, title, and description.</p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          Learn More
        </button>
      </div>
    </div>
  )
}'''
    
    # Hero
    if 'hero' in prompt_lower:
        return '''export function Hero() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-6">
          Build Better UIs with Eye-Tracking AI
        </h1>
        <p className="text-xl mb-8 opacity-90">
          Understand where users actually look, not just where they click
        </p>
        <div className="flex gap-4 justify-center">
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Get Started
          </button>
          <button className="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
            Learn More
          </button>
        </div>
      </div>
    </div>
  )
}'''
    
    # Default
    return f'''export function Component() {{
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">Generated Component</h2>
      <p className="text-gray-600">Mock component for: {prompt}</p>
      <p className="text-sm text-gray-500 mt-4">Add OpenAI API key for custom generation</p>
    </div>
  )
}}'''

if __name__ == "__main__":
    component_generator.run()

