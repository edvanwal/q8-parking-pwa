// Firebase Configuration for Q8 Parking PWA
// VAPID key: Firebase Console > Project Settings > Cloud Messaging > Web Push certificates > Generate key pair
const firebaseConfig = {
  apiKey: "AIzaSyAx2ee0zOqwO_lI5p_gFRj7VJzRB2WJTQ0",
  authDomain: "q8-parking-pwa.firebaseapp.com",
  projectId: "q8-parking-pwa",
  storageBucket: "q8-parking-pwa.firebasestorage.app",
  messagingSenderId: "410808537958",
  appId: "1:410808537958:web:6877e9435f1a78bcd12ea7",
  measurementId: "G-0L45RNP4XK",
  googleMapsApiKey: "AIzaSyD82bW_EOKkbNYc4y5G9sJcauLc_j1t8p4",
  // VAPID key for push notifications - generate in Firebase Console if empty
  messagingVapidKey: ""
};

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfig;
}
