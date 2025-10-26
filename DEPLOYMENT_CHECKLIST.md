# 🚀 Deployment Checklist for Cal Hacks

## Quick Deployment Steps

### Option 1: Railway (Easiest - 10 minutes)

#### Backend:
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Deploy backend
cd backend
railway login
railway init
railway up
```

**Set environment variables in Railway dashboard:**
- `OPENAI_API_KEY`
- `OPENROUTER_API_KEY`

**Get your backend URL:** `https://your-app.up.railway.app`

#### Frontend:
```bash
# 1. Update .env with backend URL
echo "VITE_BACKEND_URL=https://your-app.up.railway.app" > .env.production

# 2. Build and deploy
npm run build
firebase deploy --only hosting
```

**Live at:** `https://clientsight-5a400.web.app` ✅

---

### Option 2: Google Cloud Run (Free tier)

#### Backend:
```bash
# 1. Install gcloud CLI (if not installed)
# Download from: https://cloud.google.com/sdk/docs/install

# 2. Login and set project
gcloud auth login
gcloud config set project clientsight-5a400

# 3. Enable APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com

# 4. Deploy
cd backend
gcloud run deploy clientsight-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars OPENAI_API_KEY=your_key,OPENROUTER_API_KEY=your_key
```

**Get URL:** `https://clientsight-backend-xxxxx-uc.a.run.app`

#### Frontend:
```bash
# Update .env
echo "VITE_BACKEND_URL=https://clientsight-backend-xxxxx-uc.a.run.app" > .env.production

# Build and deploy
npm run build
firebase deploy --only hosting
```

---

## Pre-Deployment Checklist

### Files Created ✅
- [x] `firestore.rules` - Database security
- [x] `firebase.json` - Firebase config
- [x] `backend/Dockerfile` - Backend containerization
- [x] `backend/.dockerignore` - Docker ignore rules

### Configuration Needed
- [ ] Create `.env.production` with backend URL
- [ ] Update backend CORS with production URLs
- [ ] Set API keys in backend deployment platform
- [ ] Test production build locally

---

## Update Backend CORS for Production

In `backend/main.py`, update CORS origins:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://clientsight-5a400.web.app",
        "https://clientsight-5a400.firebaseapp.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Test Locally Before Deploying

```bash
# Build production frontend
npm run build

# Preview production build
npm run preview
```

Visit `http://localhost:4173` and test:
- [ ] Login/Signup
- [ ] Calibration
- [ ] Page generation
- [ ] Gaze tracking
- [ ] Gaze suggestions

---

## Quick Commands

### Deploy Everything (After backend is deployed once)

```bash
# 1. Update backend URL in .env.production
# 2. Build and deploy frontend
npm run build
firebase deploy --only hosting
```

### Redeploy Backend (Railway)
```bash
cd backend
railway up
```

### Redeploy Backend (Cloud Run)
```bash
cd backend
gcloud run deploy clientsight-backend --source .
```

---

## Emergency Rollback

### Frontend
```bash
# Firebase keeps previous versions
firebase hosting:rollback
```

### Backend (Cloud Run)
```bash
# List revisions
gcloud run revisions list --service clientsight-backend

# Rollback to previous
gcloud run services update-traffic clientsight-backend \
  --to-revisions REVISION-NAME=100
```

---

## Cost Monitoring

### Firebase Hosting
- Free tier: 10 GB storage, 360 MB/day
- **Estimated cost: $0/month**

### Railway
- Free: $5 credit/month
- **Estimated cost: $0-5/month**

### Google Cloud Run
- Free: 2M requests/month
- **Estimated cost: $0-5/month**

**Total estimated cost: $0-10/month** for demo/hackathon usage

---

## Troubleshooting

### Issue: CORS errors
**Fix:** Add production URLs to backend CORS

### Issue: Firebase deployment fails
```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build
firebase deploy
```

### Issue: Backend won't start
**Check:** Environment variables are set correctly

### Issue: 404 errors on refresh
**Fix:** Firebase rewrite rules are in `firebase.json` ✅

---

## For Cal Hacks Demo

### Before Demo:
1. Deploy both frontend and backend
2. Test all features work
3. Check API keys are working
4. Monitor costs (should be $0)

### Demo URLs:
- **Live App:** https://clientsight-5a400.web.app
- **Backend API:** Your Cloud Run/Railway URL

### If Something Breaks:
- Backend: Falls back to mock generation
- Frontend: Error boundaries show helpful messages
- Database: Firebase has automatic backups

---

## Success Metrics

✅ Frontend live on Firebase Hosting
✅ Backend live on Cloud Run/Railway
✅ Users can sign up/login
✅ Page generation works
✅ Gaze tracking works
✅ Gaze suggestions work
✅ No CORS errors
✅ Under $10/month cost

---

## Post-Deployment

### Monitor
- Firebase Console: https://console.firebase.google.com
- Cloud Run Console: https://console.cloud.google.com/run
- Railway Dashboard: https://railway.app/dashboard

### Update
```bash
# Make changes, then:
npm run build
firebase deploy --only hosting
```

---

## Quick Reference

**Frontend URL:** https://clientsight-5a400.web.app
**Firebase Project:** clientsight-5a400
**Project ID:** 363801379697

**Deploy Frontend:** `firebase deploy --only hosting`
**Deploy Backend (Railway):** `railway up`
**Deploy Backend (Cloud Run):** `gcloud run deploy clientsight-backend --source .`

---

## Support

Need help? Check:
- Full guide: `FIREBASE_DEPLOYMENT_GUIDE.md`
- Firebase docs: https://firebase.google.com/docs
- Cloud Run docs: https://cloud.google.com/run/docs
- Railway docs: https://docs.railway.app

Good luck at Cal Hacks! 🚀

