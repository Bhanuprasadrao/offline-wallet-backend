const Razorpay = require('razorpay');

// Get all keys from Netlify's environment variables
const { KEY_ID, KEY_SECRET, RAZORPAYX_ACCOUNT_NUMBER } = process.env;

const razorpay = new Razorpay({
    key_id: KEY_ID,
    key_secret: KEY_SECRET
});

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { amount, upiId } = JSON.parse(event.body);

        if (!amount || !upiId) {
            return { statusCode: 400, body: 'Missing required fields: amount and upiId.' };
        }
        
        // --- THIS IS THE FIX ---
        // The account_number is now read from the secure environment variable.
        const payoutData = {
            account_number: RAZORPAYX_ACCOUNT_NUMBER,
            fund_account: {
                account_type: "vpa",
                vpa: {
                    address: upiId
                },
                contact: {
                    name: "Recipient Name" // Placeholder
                }
            },
            amount: amount,
            currency: "INR",
            mode: "UPI",
            purpose: "payout",
            queue_if_low_balance: true
        };
        // --- END OF FIX ---
        
        const payout = await razorpay.payouts.create(payoutData);
        
        console.log("Payout initiated:", payout);

        return {
            statusCode: 200,
            body: JSON.stringify({
                payoutId: payout.id,
                status: payout.status
            })
        };

    } catch (error) {
        console.error("Error creating Razorpay payout:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Failed to process payout. Check server logs."
            })
        };
    }
};