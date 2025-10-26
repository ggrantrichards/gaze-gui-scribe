# 🚀 Deploy Fetch.ai Agents to Cloud for Firebase

This guide shows you how to deploy your Fetch.ai agents to the cloud so they work with your Firebase-hosted website.

## 🌟 Quick Deployment Options

### **Option 1: Railway (Recommended)**

Railway is the easiest way to deploy Python agents:

1. **Sign up at [Railway.app](https://railway.app)**
2. **Connect your GitHub repo**
3. **Deploy the `backend` folder**
4. **Set environment variables**

#### Railway Setup Steps:

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Initialize project
cd backend
railway init

# 4. Deploy
railway up
```

#### Environment Variables for Railway:
- `OPENROUTER_API_KEY` - Your OpenRouter API key
- `OPENAI_API_KEY` - Your OpenAI API key (optional)
- `SITE_URL` - https://clientsight-5a400.web.app
- `SITE_NAME` - ClientSight

### **Option 2: Google Cloud Run**

Deploy to Google Cloud Run (good for Google ecosystem):

```bash
# 1. Install Google Cloud CLI
# 2. Build and deploy
cd backend
gcloud run deploy clientsight-agents \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### **Option 3: Heroku**

Deploy to Heroku (classic PaaS):

```bash
# 1. Install Heroku CLI
# 2. Create app
cd backend
heroku create clientsight-agents

# 3. Set environment variables
heroku config:set OPENROUTER_API_KEY=your-key-here
heroku config:set SITE_URL=https://clientsight-5a400.web.app

# 4. Deploy
git push heroku main
```

## 🔧 Update Frontend to Use Cloud Agents

Once your agents are deployed to the cloud, update your frontend:

### **1. Update API Base URL**

In your frontend code, change the API base URL from localhost to your cloud deployment:

```typescript
// Before (localhost)
const API_BASE = 'http://localhost:8000'

// After (cloud deployment)
const API_BASE = 'https://your-railway-app.railway.app'
// or
const API_BASE = 'https://your-cloud-run-url.run.app'
```

### **2. Update Environment Variables**

Create a `.env.local` file in your frontend:

```env
VITE_API_BASE_URL=https://your-deployed-agents-url.com
VITE_FIREBASE_PROJECT_ID=clientsight-5a400
```

### **3. Update API Calls**

Make sure all your API calls use the environment variable:

```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Use API_BASE in all fetch calls
const response = await fetch(`${API_BASE}/api/generate-component`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
```

## 🧪 Testing Cloud Deployment

### **1. Test Agent Health**

```bash
# Test your deployed agents
curl https://your-deployed-agents-url.com/

# Should return:
{
  "service": "ClientSight Agent API",
  "status": "running",
  "agents": {
    "component_generator": "agent1...",
    "gaze_optimizer": "agent1..."
  }
}
```

### **2. Test Component Generation**

```bash
curl -X POST https://your-deployed-agents-url.com/api/generate-component \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a hero section for a tech startup"}'
```

### **3. Test with Firebase Site**

1. **Deploy your frontend** with the new API URL
2. **Open your Firebase site**
3. **Try generating a component**
4. **Check browser network tab** for API calls

## 🔍 Troubleshooting

### **Common Issues:**

1. **CORS Errors**: Make sure your cloud deployment has the correct CORS origins
2. **Environment Variables**: Ensure all required env vars are set in cloud
3. **Port Issues**: Cloud services use `PORT` environment variable
4. **Agent Communication**: Agents need to be able to communicate with each other

### **Debug Commands:**

```bash
# Check if agents are running
curl https://your-deployment-url.com/

# Check logs (Railway)
railway logs

# Check logs (Google Cloud Run)
gcloud run services logs read clientsight-agents

# Check logs (Heroku)
heroku logs --tail
```

## 📊 Monitoring

### **Railway Dashboard:**
- View logs in real-time
- Monitor resource usage
- Set up alerts

### **Google Cloud Console:**
- View Cloud Run metrics
- Set up monitoring alerts
- Check logs and errors

### **Heroku Dashboard:**
- View app metrics
- Monitor dyno usage
- Check logs

## 🚀 Production Checklist

- [ ] Agents deployed to cloud
- [ ] Environment variables set
- [ ] CORS configured for Firebase domain
- [ ] Frontend updated with cloud API URL
- [ ] Firebase site deployed with new config
- [ ] End-to-end testing completed
- [ ] Monitoring set up
- [ ] Error handling in place

## 💡 Pro Tips

1. **Use Railway** for easiest deployment
2. **Set up monitoring** from day one
3. **Use environment variables** for all config
4. **Test locally first** with cloud API
5. **Keep logs** for debugging
6. **Set up alerts** for failures

Your Fetch.ai agents will now work with your deployed Firebase website! 🎉
