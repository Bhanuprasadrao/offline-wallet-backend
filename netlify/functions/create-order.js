const Razorpay = require('razorpay');

// Get keys from Netlify's secure environment variables
const { KEY_ID, KEY_SECRET } = process.env;

const razorpay = new Razorpay({
    key_id: KEY_ID,
    key_secret: KEY_SECRET
});

// This is the main function Netlify runs for this endpoint
exports.handler = async (event) => {

    // --- START OF DEFINITIVE FIX ---

    // Define the CORS headers that give your website permission to call this function.
    const headers = {
        'Access-Control-Allow-Origin': '*', // Allows any origin
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS' // Allow POST and preflight OPTIONS requests
    };

    // Browsers send a "preflight" OPTIONS request first to ask for permission.
    // We must handle this and respond with a 204 No Content.
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers,
            body: ''
        };
    }
    
    // Only allow POST requests for the actual logic.
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    // --- END OF DEFINITIVE FIX ---


    try {
        const { amount, currency } = JSON.parse(event.body);

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return { statusCode: 400, headers, body: 'Invalid amount provided.' };
        }

        const options = {
            amount: amount,
            currency: currency || "INR",
            receipt: `receipt_order_${new Date().getTime()}`
        };
        
        console.log("Creating Razorpay order with options:", options);
        const order = await razorpay.orders.create(options);
        
        if (!order) {
            console.error("Razorpay order creation returned null.");
            return { statusCode: 500, headers, body: "Error creating Razorpay order." };
        }
        
        console.log("Successfully created order:", order);
        return {
            statusCode: 200,
            headers, // Add the CORS headers to the successful response
            body: JSON.stringify({
                orderId: order.id,
                amount: order.amount
            })
        };

    } catch (error) {
        console.error("--- CREATE ORDER FAILED ---");
        console.error(error);
        return {
            statusCode: 500,
            headers, // Also add CORS headers to error responses
            body: JSON.stringify({
                error: "Failed to create payment order. Check server logs for details."
            })
        };
    }
};