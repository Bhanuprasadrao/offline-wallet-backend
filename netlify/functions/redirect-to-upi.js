// This function's only job is to perform an HTTP redirect.

exports.handler = async (event) => {
    // Get the original UPI URL from the query parameter.
    const upiUrl = event.queryStringParameters.url;

    if (!upiUrl) {
        return {
            statusCode: 400,
            body: "Error: No UPI URL provided for redirection."
        };
    }

    // This is the magic. We return a 302 Redirect status code
    // and set the 'Location' header to the original upi:// link.
    // The browser will automatically follow this redirect.
    return {
        statusCode: 302,
        headers: {
            'Location': upiUrl
        },
        body: '' // The body is empty for a redirect
    };
};