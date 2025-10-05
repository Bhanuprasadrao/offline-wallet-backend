const admin = require('firebase-admin');

// Get the secure JSON content from the Netlify environment variable
const { FIREBASE_ADMIN_SDK_CONFIG } = process.env;

// This professional pattern ensures Firebase is initialized only ONCE.
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
    // This will provide a clear error in your Netlify logs if the env variable is wrong.
  }
}

// Export the initialized firestore database instance for all other functions to use.
module.exports = {
  db: admin.firestore()
};