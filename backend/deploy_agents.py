#!/usr/bin/env python3
"""
Deploy Fetch.ai Agents to Cloud
Simplified version that starts the main API server with agent integration
"""

import os
import sys
from pathlib import Path

# Add current directory to path
sys.path.append(str(Path(__file__).parent))

def start_cloud_deployment():
    """Start the main API server for cloud deployment"""
    print("🌟 ClientSight Fetch.ai Agents - Cloud Deployment")
    print("📍 Starting API server with agent integration...")
    
    # Import and start the main FastAPI app
    from main import app
    import uvicorn
    
    # Get port from environment (Railway provides this)
    port = int(os.getenv("PORT", 8000))
    
    print(f"🌐 Starting server on port {port}")
    print("✅ Agents will be initialized when API server starts")
    
    # Start the server
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )

if __name__ == "__main__":
    try:
        start_cloud_deployment()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
