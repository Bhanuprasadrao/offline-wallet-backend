exports.handler = async (event) => {
    const upiUrl = event.queryStringParameters.url;

    if (!upiUrl) {
        return {
            statusCode: 400,
            body: "Error: No UPI URL provided for redirection."
        };
    }

    // This redirects the user's browser to the upi:// link.
    return {
        statusCode: 302,
        headers: {
            'Location': upiUrl
        },
        body: ''
    };
};