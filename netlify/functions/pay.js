const admin = require('firebase-admin');
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

exports.handler = async (event) => {
    const pathParts = event.path.split('/').filter(p => p);
    const shortCode = pathParts[1];

    if (!shortCode) {
        return { statusCode: 400, body: "Short code is missing." };
    }

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