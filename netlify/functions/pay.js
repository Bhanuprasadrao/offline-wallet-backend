const admin = require('firebase-admin');
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const { db } = require('./firebase-admin-helper');

exports.handler = async (event) => {
    const pathParts = event.path.split('/').filter(p => p);
    const shortCode = pathParts[1];
    
    console.log(`Redirect function triggered for code: ${shortCode}`);

    if (!shortCode) {
        console.error("No short code provided in path.");
        return { statusCode: 400, body: "Short code is missing." };
    }

    try {
        const docRef = db.collection('shortlinks').doc(shortCode);
        const doc = await docRef.get();

        if (!doc.exists) {
            console.error(`Firestore document with code '${shortCode}' does not exist.`);
            return { statusCode: 404, body: "Link not found or expired." };
        }
        
        const originalUrl = doc.data().originalUrl;
        if (!originalUrl) {
            console.error(`Document '${shortCode}' exists but has no 'originalUrl' field.`);
            return { statusCode: 500, body: "Link data is corrupted." };
        }
        
        console.log(`Found original URL: ${originalUrl}. Redirecting...`);
        
        // Delete the link after it's been used to prevent reuse.
        await docRef.delete();
        
        return {
            statusCode: 302,
            headers: { 'Location': originalUrl },
            body: ''
        };
    } catch (error) {
        console.error("Firestore read/redirect error:", error);
        return { statusCode: 500, body: "Error processing redirect." };
    }
};