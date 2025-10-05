const admin = require('firebase-admin');

// Get the secure config from Netlify's environment variables
const { FIREBASE_ADMIN_SDK_CONFIG } = process.env;

// This is a standard professional pattern to prevent re-initialization errors.
// It checks if the Firebase app is already initialized before trying again.
if (!admin.apps.length) {
  try {
    // We must parse the JSON string from the environment variable
    const serviceAccount = JSON.parse(FIREBASE_ADMIN_SDK_CONFIG);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error) {
    console.error("CRITICAL: Error initializing Firebase Admin SDK:", error);
  }
}

// Export the initialized firestore database instance for other functions to use.
module.exports = {
  db: admin.firestore()
};