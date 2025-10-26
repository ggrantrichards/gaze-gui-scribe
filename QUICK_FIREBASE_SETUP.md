# 🔥 Quick Firebase Setup Guide

## ✅ Dependencies Installed

All required packages are now installed:
- Firebase SDK
- Framer Motion
- React Router DOM
- Radix UI components (for Shadcn)
- Utility libraries (clsx, tailwind-merge, class-variance-authority)

---

## 🚀 Next Steps to Run the App

### **1. Add Firebase Configuration**

Create `.env.local` in the project root:

```bash
# Firebase Configuration (Required)
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=clientsight-5a400.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=clientsight-5a400.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=363801379697
VITE_FIREBASE_APP_ID=your_app_id_here
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id_here

# Backend API (Optional - defaults to localhost:8000)
VITE_BACKEND_URL=http://localhost:8000
```

### **2. Get Your Firebase Keys**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **clientsight-5a400**
3. Click the gear icon (⚙️) → Project Settings
4. Scroll down to "Your apps"
5. Click on the web app (or create one if none exists)
6. Copy the `firebaseConfig` values to your `.env.local`

**Example from Firebase Console:**
```javascript
const firebaseConfig = {
  apiKey: "AIza...",           // → VITE_FIREBASE_API_KEY
  authDomain: "clientsight...", // → VITE_FIREBASE_AUTH_DOMAIN
  projectId: "clientsight-5a400",
  storageBucket: "...",         // → VITE_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "...",     // → VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: "...",                 // → VITE_FIREBASE_APP_ID
  measurementId: "..."          // → VITE_FIREBASE_MEASUREMENT_ID
};
```

### **3. Enable Authentication in Firebase**

1. In Firebase Console → **Authentication**
2. Click **"Get started"** (if first time)
3. Go to **Sign-in method** tab
4. Enable:
   - ✅ **Email/Password** - Click Enable, Save
   - ✅ **Google** - Click Enable, add your email, Save

### **4. Set up Firestore Database**

1. In Firebase Console → **Firestore Database**
2. Click **"Create database"**
3. Choose **Start in production mode**
4. Select a location (choose closest to your users)
5. Click **Enable**

### **5. Add Firestore Security Rules**

In Firestore → **Rules** tab, paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Projects
    match /projects/{projectId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
    
    // Chat sessions
    match /chatSessions/{sessionId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
  }
}
```

Click **Publish**

---

## 🎯 Run the Application

### **Terminal 1 - Frontend:**
```bash
npm run dev
# or
pnpm dev
```

### **Terminal 2 - Backend:**
```bash
cd backend
python main.py
```

---

## 🧪 Test the Complete Flow

1. Open `http://localhost:5173/`
2. You should see the **Landing Page**
3. Click **"Get Started"** → Redirects to Signup
4. Sign up with email or Google
5. Complete the **Onboarding Flow**:
   - Welcome screen
   - Introduction to features
   - **Eye-gaze calibration**
   - Completion screen
6. Enter the **Main App** (existing page builder)

---

## ⚠️ Common Issues

### **Issue: "Firebase: Error (auth/invalid-api-key)"**
- Check that your API key in `.env.local` is correct
- Make sure the file is named `.env.local` (not `.env`)
- Restart the dev server after adding `.env.local`

### **Issue: "Firebase: Error (auth/unauthorized-domain)"**
- In Firebase Console → Authentication → Settings
- Add `localhost` to Authorized domains

### **Issue: "Missing dependencies"**
```bash
# If you see import errors, reinstall:
npm install
# or
pnpm install
```

### **Issue: Backend not starting**
```bash
# Make sure Python dependencies are installed:
cd backend
pip install -r requirements.txt
```

---

## 📁 Project Structure

```
ClientSight/
├── src/
│   ├── lib/
│   │   ├── firebase.ts         # Firebase config
│   │   ├── auth.ts             # Auth utilities
│   │   └── firestore.ts        # Database operations
│   ├── contexts/
│   │   └── AuthContext.tsx     # Auth state
│   ├── pages/
│   │   ├── LandingPage.tsx     # Marketing page
│   │   ├── LoginPage.tsx       # Login form
│   │   ├── SignupPage.tsx      # Registration
│   │   ├── OnboardingFlow.tsx  # 4-step onboarding
│   │   └── Index.tsx           # Main app
│   ├── App.tsx                 # Routes
│   └── main.tsx                # Entry point
├── backend/
│   ├── main.py                 # FastAPI server
│   ├── agents/                 # Fetch.ai agents
│   └── services/               # OpenRouter, etc.
└── .env.local                  # 🔥 Create this!
```

---

## ✅ Verification Checklist

Before testing, make sure:

- [ ] `.env.local` file created with all Firebase keys
- [ ] Email/Password auth enabled in Firebase Console
- [ ] Google auth enabled in Firebase Console
- [ ] Firestore database created
- [ ] Firestore security rules published
- [ ] `localhost` added to Firebase authorized domains
- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173

---

## 🎉 You're Ready!

Once all Firebase configuration is complete, your full onboarding system will be live!

**Flow:**
```
Landing Page → Signup → Onboarding → Calibration → Main App
```

**Features Working:**
- ✅ Email/Password authentication
- ✅ Google OAuth
- ✅ User profiles in Firestore
- ✅ Protected routes
- ✅ Onboarding with calibration
- ✅ Session persistence

---

## 📞 Need Help?

Common resources:
- [Firebase Docs](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [React Router](https://reactrouter.com/)

---

**Status:** ✅ **All dependencies installed!**  
**Next:** Add Firebase keys to `.env.local` and run the app!

