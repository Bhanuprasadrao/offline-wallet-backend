// --- THIS IS THE FIX ---
// It also gets its 'db' instance from the same, single helper file.
const { db } = require('./firebase-admin-helper');

exports.handler = async (event) => {
    const shortCode = event.queryStringParameters.code;
    
    console.log(`Redirector triggered for code: ${shortCode}`);

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
        
        await docRef.delete();
        
        return {
            statusCode: 302,
            headers: { 'Location': originalUrl },
            body: ''
        };
    } catch (error) {
        console.error("Firestore redirect error:", error);
        return { statusCode: 500, body: "Error processing redirect." };
    }
};