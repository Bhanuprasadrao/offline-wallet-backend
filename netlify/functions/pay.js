const admin = require('firebase-admin');

// --- THIS IS THE FIX ---
// Initialize Firebase Admin by requiring the key file directly.
// This is a robust method for Netlify deployments.
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();
// --- END OF FIX ---

exports.handler = async (event) => {
    const pathParts = event.path.split('/').filter(p => p);
    const shortCode = pathParts[1];

    if (!shortCode) { return { statusCode: 400, body: "Short code missing." }; }

    try {
        const docRef = db.collection('shortlinks').doc(shortCode);
        const doc = await docRef.get();

        if (!doc.exists || !doc.data().originalUrl) {
            return { statusCode: 404, body: "Link not found or expired." };
        }
        
        const originalUrl = doc.data().originalUrl;
        await docRef.delete();
        
        return {
            statusCode: 302,
            headers: { 'Location': originalUrl },
            body: ''
        };
    } catch (error) {
        console.error("Redirect error:", error);
        return { statusCode: 500, body: "Error processing redirect." };
    }
};