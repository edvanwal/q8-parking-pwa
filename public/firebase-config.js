// Firebase Configuration for Q8 Parking PWA
const firebaseConfig = {
  apiKey: "AIzaSyAx2ee0zOqwO_lI5p_gFRj7VJzRB2WJTQ0",
  authDomain: "q8-parking-pwa.firebaseapp.com",
  projectId: "q8-parking-pwa",
  storageBucket: "q8-parking-pwa.firebasestorage.app",
  messagingSenderId: "410808537958",
  appId: "1:410808537958:web:6877e9435f1a78bcd12ea7",
  measurementId: "G-0L45RNP4XK",
  googleMapsApiKey: "AIzaSyDk9uYiT_LzqOq2Fr9BYSMwsIVAWyJ9kL4"
};

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfig;
}
