const Razorpay = require('razorpay');

const { KEY_ID, KEY_SECRET } = process.env;

const razorpay = new Razorpay({
    key_id: KEY_ID,
    key_secret: KEY_SECRET
});

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { amount, currency } = JSON.parse(event.body);

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return { statusCode: 400, body: 'Invalid amount provided.' };
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
            return { statusCode: 500, body: "Error creating Razorpay order." };
        }
        
        console.log("Successfully created order:", order);
        return {
            statusCode: 200,
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
            body: JSON.stringify({
                error: "Failed to create payment order. Check server logs for details."
            })
        };
    }
};