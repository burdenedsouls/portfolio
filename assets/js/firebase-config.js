// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
    // These values will be provided by Firebase when you create a project
    apiKey: "AIzaSyDIJ7am-y8LktnhoEpSk63cbwYz0hDlJvk",
    authDomain: "portfolio-2ee52.firebaseapp.com",
    projectId: "portfolio-2ee52",
    storageBucket: "portfolio-2ee52.firebasestorage.app",
    messagingSenderId: "405236495212",
    appId: "1:405236495212:web:3068e5d965e69181e23949",
    measurementId: "G-5434SJM83K",
    databaseURL: "https://portfolio-2ee52-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
export default firebaseConfig; 