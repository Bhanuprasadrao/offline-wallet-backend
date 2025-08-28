const Razorpay = require('razorpay');

// Get your Razorpay keys from Netlify's environment variables
const { KEY_ID, KEY_SECRET } = process.env;

const razorpay = new Razorpay({
    key_id: KEY_ID,
    key_secret: KEY_SECRET
});

// This is the main function that Netlify will run
exports.handler = async (event) => {
    // Netlify functions are triggered by HTTP requests.
    // We only accept POST requests for this function.
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed'
        };
    }

    try {
        const { amount, currency } = JSON.parse(event.body);

        const options = {
            amount: amount, // Amount in the smallest currency unit (paise)
            currency: currency,
            receipt: `receipt_order_${new Date().getTime()}`
        };
        
        const order = await razorpay.orders.create(options);
        
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                orderId: order.id,
                amount: order.amount
            })
        };

    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Failed to create payment order."
            })
        };
    }
};