const { db } = require('./firebase-admin-helper');

exports.handler = async (event) => {
    
    const pathParts = event.path.split('/').filter(p => p.trim() !== ''); 
    
    const shortCode = pathParts.pop();
    
    console.log(`Redirector function triggered for path: ${event.path}. Extracted code: [${shortCode}]`);

    if (!shortCode) {
        console.error("Could not extract a short code from the path:", event.path);
        return { statusCode: 400, body: "Bad Request: Short code is missing from URL." };
    }

    try {
        const docRef = db.collection('shortlinks').doc(shortCode);
        const doc = await docRef.get();

        if (!doc.exists) {
            console.error(`Firestore document with code '${shortCode}' does not exist.`);
            return { statusCode: 404, body: "This link was not found or has already been used." };
        }
        
        const originalUrl = doc.data().originalUrl;
        if (!originalUrl) {
            console.error(`Document '${shortCode}' exists but has no 'originalUrl' field.`);
            return { statusCode: 500, body: "Link data is corrupted. Please try again." };
        }
        
        console.log(`Found original URL: ${originalUrl}. Redirecting user...`);
        
        await docRef.delete();
        
        return {
            statusCode: 302,
            headers: {
                'Location': originalUrl
            },
            body: ''
        };
    } catch (error) {
        console.error("Firestore read/redirect error:", error);
        return { statusCode: 500, body: "An internal error occurred while processing the link." };
    }
};