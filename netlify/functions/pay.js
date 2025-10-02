const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
    // The path will be like "/pay/a7X2bZ". We need to get the code part.
    const pathParts = event.path.split('/').filter(p => p);
    const shortCode = pathParts[1];

    if (!shortCode) {
        return { statusCode: 400, body: "Short code is missing." };
    }

    try {
        const linkStore = getStore("upi_links"); // Get our database store
        const originalUrl = await linkStore.get(shortCode); // Look up the code

        if (!originalUrl) {
            return { statusCode: 404, body: "Link not found or expired." };
        }
        
        // This is the magic: redirect the browser to the original upi:// link
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