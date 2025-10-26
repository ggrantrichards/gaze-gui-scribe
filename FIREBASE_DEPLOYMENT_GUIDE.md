# Firebase Deployment Guide 🚀

## Overview

Your ClientSight app has two parts:
1. **Frontend (React/Vite)** → Deploy to **Firebase Hosting** ✅
2. **Backend (Python/FastAPI)** → Deploy to **Google Cloud Run** (Firebase doesn't support Python backends)

---

## Part 1: Deploy Frontend to Firebase Hosting

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

This opens your browser to authenticate.

### Step 3: Initialize Firebase Hosting

```bash
firebase init hosting
```

**Configuration options:**
- Use existing project: **clientsight-5a400** ✅
- Public directory: **dist** (important! This is where Vite builds to)
- Configure as SPA: **Yes**
- Set up automatic builds with GitHub: **No** (for now)
- Overwrite index.html: **No**

### Step 4: Update `firebase.json`

Replace your `firebase.json` with:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

### Step 5: Create Firestore rules

Create `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read/write their own projects
    match /projects/{projectId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Users can read/write their own chat sessions
    match /chatSessions/{sessionId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

### Step 6: Build the frontend

```bash
npm run build
```

This creates the `dist` folder with your optimized production build.

### Step 7: Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

Your app will be live at: `https://clientsight-5a400.web.app` 🎉

---

## Part 2: Deploy Backend to Google Cloud Run

Firebase Hosting only supports static sites, so we need Cloud Run for the Python backend.

### Step 1: Create `Dockerfile` in backend folder

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8080

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### Step 2: Create `.dockerignore` in backend folder

Create `backend/.dockerignore`:

```
__pycache__
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.env
*.log
```

### Step 3: Install Google Cloud CLI

Download from: https://cloud.google.com/sdk/docs/install

### Step 4: Initialize gcloud

```bash
gcloud init
```

Select your project: **clientsight-5a400**

### Step 5: Enable required APIs

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
```

### Step 6: Build and deploy to Cloud Run

```bash
cd backend

gcloud run deploy clientsight-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars OPENAI_API_KEY=your_key_here,OPENROUTER_API_KEY=your_key_here
```

**Important:** Replace `your_key_here` with your actual API keys!

This will:
1. Build a Docker container
2. Push it to Google Container Registry
3. Deploy it to Cloud Run
4. Give you a URL like: `https://clientsight-backend-xxxxx-uc.a.run.app`

### Step 7: Update frontend environment variable

Update `.env` or create `.env.production`:

```bash
VITE_BACKEND_URL=https://clientsight-backend-xxxxx-uc.a.run.app
```

Then rebuild and redeploy frontend:

```bash
npm run build
firebase deploy --only hosting
```

---

## Alternative: Deploy Backend to Railway (Easier)

Railway is simpler than Cloud Run for Python backends:

### Step 1: Sign up at [railway.app](https://railway.app)

### Step 2: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 3: Login

```bash
railway login
```

### Step 4: Deploy backend

```bash
cd backend
railway init
railway up
```

### Step 5: Add environment variables

In Railway dashboard:
- Add `OPENAI_API_KEY`
- Add `OPENROUTER_API_KEY`
- Add `FETCH_AI_AGENT_KEY` (if needed)

### Step 6: Get your backend URL

Railway gives you: `https://clientsight-backend.up.railway.app`

Update frontend `.env.production` and redeploy.

---

## Environment Variables Setup

### Frontend (.env.production)

Create `.env.production`:

```bash
# Backend URL (Cloud Run or Railway)
VITE_BACKEND_URL=https://your-backend-url.com

# Firebase config (from Firebase Console)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=clientsight-5a400.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=clientsight-5a400
VITE_FIREBASE_STORAGE_BUCKET=clientsight-5a400.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=363801379697
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

### Backend (Set in Cloud Run or Railway)

- `OPENAI_API_KEY`
- `OPENROUTER_API_KEY`
- `FETCH_AI_AGENT_KEY` (optional)

---

## Quick Deployment Commands

### Frontend Only (after backend is deployed)

```bash
npm run build
firebase deploy --only hosting
```

### Backend to Cloud Run

```bash
cd backend
gcloud run deploy clientsight-backend --source .
```

### Backend to Railway

```bash
cd backend
railway up
```

---

## Testing Deployment

### Test Frontend
Visit: `https://clientsight-5a400.web.app`

### Test Backend
Visit: `https://your-backend-url.com/` (should show API info)

### Test Integration
1. Sign up/login on frontend
2. Try generating a landing page
3. Check browser console for any CORS errors

---

## Common Issues

### Issue: CORS errors after deployment

**Fix:** Update backend CORS origins:

```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://clientsight-5a400.web.app",  # Add your Firebase domain
        "https://clientsight-5a400.firebaseapp.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: Backend port error

Cloud Run requires port 8080 (not 8000). The Dockerfile already handles this.

### Issue: Environment variables not working

- **Frontend:** Make sure variables start with `VITE_`
- **Backend:** Set them in Cloud Run/Railway dashboard, not in code

### Issue: Build fails

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

---

## Cost Estimates

### Firebase Hosting
- **Free tier**: 10 GB storage, 360 MB/day transfer
- Likely **$0/month** for your usage

### Google Cloud Run
- **Free tier**: 2 million requests/month, 180,000 vCPU-seconds
- Estimated: **$0-5/month** for demo usage
- Scales to zero when not in use ✅

### Railway
- **Free tier**: $5 credit/month
- After that: **~$5-10/month**
- Always running (doesn't scale to zero)

**Recommendation:** Use Cloud Run for backend (better free tier)

---

## GitHub Actions (Optional - Auto Deploy)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: clientsight-5a400
```

---

## Local Testing Before Deployment

### Test production build locally:

```bash
# Build
npm run build

# Preview
npm run preview
```

Visit `http://localhost:4173`

---

## Deployment Checklist

- [ ] Firebase project created ✅
- [ ] Frontend builds successfully
- [ ] Backend deployed to Cloud Run/Railway
- [ ] Environment variables set in both
- [ ] CORS configured with production URLs
- [ ] Firestore rules deployed
- [ ] Test signup/login
- [ ] Test AI generation
- [ ] Test gaze tracking
- [ ] Test gaze suggestions

---

## Quick Start (TL;DR)

```bash
# 1. Build frontend
npm run build

# 2. Deploy frontend
firebase deploy --only hosting

# 3. Deploy backend (Railway - easiest)
cd backend
railway login
railway init
railway up

# 4. Update frontend with backend URL
# Edit .env.production with Railway URL
npm run build
firebase deploy --only hosting

# Done! 🎉
```

Your app is now live and ready for Cal Hacks demo! 🚀

