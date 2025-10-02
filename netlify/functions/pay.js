const admin = require('firebase-admin');
const { FIREBASE_ADMIN_SDK_CONFIG } = process.env;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(FIREBASE_ADMIN_SDK_CONFIG)),
  });
}
const db = admin.firestore();

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
        
        // Optional: Delete the link after it's been used once
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