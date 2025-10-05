const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const { FIREBASE_ADMIN_SDK_CONFIG } = process.env;
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(FIREBASE_ADMIN_SDK_CONFIG))
  });
}
const db = admin.firestore();

exports.handler = async (event) => {
    // The short code is passed as a query parameter by the redirect rule
    const shortCode = event.queryStringParameters.code;
    
    console.log(`Redirector function triggered for code: ${shortCode}`);

    if (!shortCode) {
        return { statusCode: 400, body: "Short code is missing." };
    }

    try {
        const docRef = db.collection('shortlinks').doc(shortCode);
        const doc = await docRef.get();

        if (!doc.exists) {
            return { statusCode: 404, body: "Link not found or has expired." };
        }
        
        const originalUrl = doc.data().originalUrl;
        if (!originalUrl) {
            return { statusCode: 500, body: "Link data is corrupted." };
        }
        
        console.log(`Found original URL: ${originalUrl}. Redirecting...`);
        
        // Delete the link after it's been used to prevent reuse.
        await docRef.delete();
        
        return {
            statusCode: 302, // 302 is a standard redirect
            headers: { 'Location': originalUrl },
            body: ''
        };
    } catch (error) {
        console.error("Firestore read/redirect error:", error);
        return { statusCode: 500, body: "Error processing redirect." };
    }
};