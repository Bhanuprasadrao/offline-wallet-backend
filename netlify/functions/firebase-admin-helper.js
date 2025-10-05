const admin = require('firebase-admin');

// Get the secure config from Netlify environment variables
const { FIREBASE_ADMIN_SDK_CONFIG } = process.env;

// This is a standard pattern to prevent re-initialization errors in serverless environments.
// It checks if the app is already initialized before trying to initialize it again.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(FIREBASE_ADMIN_SDK_CONFIG))
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
  }
}

// Export the initialized firestore database instance for other functions to use.
module.exports = {
  db: admin.firestore()
};