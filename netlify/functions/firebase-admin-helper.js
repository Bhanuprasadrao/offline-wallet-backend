const admin = require('firebase-admin');
const { FIREBASE_ADMIN_SDK_CONFIG } = process.env;
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(FIREBASE_ADMIN_SDK_CONFIG);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error) {
    console.error("CRITICAL: Error initializing Firebase Admin SDK:", error);
  }
}
module.exports = {
  admin: admin,
  db: admin.firestore()
};