// Get the initialized Firestore database instance from our helper file
const { db } = require('./firebase-admin-helper');

exports.handler = async (event) => {
    // This is the query parameter name defined in netlify.toml (`?code=:shortcode`)
    const shortCode = event.queryStringParameters.code;
    
    console.log(`Redirector function triggered for code: [${shortCode}]`);

    if (!shortCode) {
        console.error("Query parameter 'code' was missing from the request.");
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
        
        // As a security measure, we delete the link immediately after it's been read
        // to prevent it from being used twice.
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