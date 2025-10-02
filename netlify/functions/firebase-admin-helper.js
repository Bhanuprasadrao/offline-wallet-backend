const admin = require('firebase-admin');
const serviceAccount = require("./serviceAccountKey.json");

// This ensures Firebase is initialized only ONCE in the entire application lifecycle.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Export the initialized firestore instance for other functions to use.
module.exports.db = admin.firestore();