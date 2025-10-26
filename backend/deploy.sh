#!/bin/bash

# Deploy Fetch.ai Agents to Railway
echo "🚀 Deploying ClientSight Fetch.ai Agents to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Logging into Railway..."
railway login

# Initialize Railway project (if not already initialized)
if [ ! -f "railway.json" ]; then
    echo "📦 Initializing Railway project..."
    railway init
fi

# Set environment variables
echo "🔧 Setting environment variables..."
railway variables set OPENROUTER_API_KEY=$OPENROUTER_API_KEY
railway variables set SITE_URL=https://clientsight-5a400.web.app
railway variables set SITE_NAME=ClientSight

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "🌐 Your agents are now available at: https://your-app.railway.app"
echo "📝 Update your frontend to use the new API URL"
