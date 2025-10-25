import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDfUdDf7IGURQCVtnSFMTks-SgT_BV7Oo0",
  authDomain: "gazeuiautomation.firebaseapp.com",
  projectId: "gazeuiautomation",
  storageBucket: "gazeuiautomation.firebasestorage.app",
  messagingSenderId: "766585316015",
  appId: "1:766585316015:web:ab3e007a10165b74e1aa5a",
  measurementId: "G-7YEZ9HBWJ1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);