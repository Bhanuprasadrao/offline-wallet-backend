const Razorpay = require('razorpay');

// Get keys from Netlify's secure environment variables
const { KEY_ID, KEY_SECRET } = process.env;

const razorpay = new Razorpay({
    key_id: KEY_ID,
    key_secret: KEY_SECRET
});

// This is the main function Netlify runs for this endpoint
exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { amount, currency } = JSON.parse(event.body);

        // Basic server-side validation
        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return { statusCode: 400, body: 'Invalid amount provided.' };
        }

        const options = {
            amount: amount, // Amount in the smallest currency unit (e.g., paise)
            currency: currency || "INR",
            receipt: `receipt_order_${new Date().getTime()}`,
            method: "upi" 
        };
        
        console.log("Creating Razorpay order with options:", options);
        const order = await razorpay.orders.create(options);
        
        if (!order) {
            console.error("Razorpay order creation returned null.");
            return { statusCode: 500, body: "Error creating Razorpay order." };
        }
        
        console.log("Successfully created order:", order);
        return {
            statusCode: 200,
            body: JSON.stringify({
                orderId: order.id,
                amount: order.amount,
                notes: order.notes 
            })
        };

    } catch (error) {
        console.error("--- CREATE ORDER FAILED ---");
        // Log the detailed error from the Razorpay SDK
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Failed to create payment order. Check server logs for details."
            })
        };
    }
};