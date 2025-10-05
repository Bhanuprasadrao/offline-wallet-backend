// Get the initialized Firestore database instance from our helper file
const { db } = require('./firebase-admin-helper');

exports.handler = async (event) => {
    // --- THIS IS THE DEFINITIVE FIX ---
    // For a 'status = 200' rewrite, the short code is part of the path.
    // Example path: /.netlify/functions/redirector
    // We need to get it from the original requested path.
    
    // The original path from the browser is in event.path
    // Example: /r/abcdefg
    const pathParts = event.path.split('/').filter(p => p.trim() !== ''); // -> ["r", "abcdefg"]
    
    // The short code is the last part of the path.
    const shortCode = pathParts.pop();
    // --- END OF THE FIX ---
    
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
        
        // Return a 302 Redirect, which tells the browser to immediately go to the new URL.
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