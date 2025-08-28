const Razorpay = require('razorpay');

// Get your Razorpay keys from Netlify's environment variables
const { KEY_ID, KEY_SECRET } = process.env;

// IMPORTANT: For Payouts, Razorpay often uses a different instance or setup.
// This assumes you are using RazorpayX.
const razorpay = new Razorpay({
    key_id: KEY_ID,
    key_secret: KEY_SECRET
});

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { amount, currency, upiId, mode, purpose } = JSON.parse(event.body);

        // Basic validation
        if (!amount || !upiId) {
            return { statusCode: 400, body: 'Missing required fields: amount and upiId.' };
        }
        
        // In a real app, you would first securely verify this request is from the
        // legitimate user (e.g., using a Firebase Admin SDK to check their auth token).
        // Then, you would deduct the token balance from their Firestore document *before*
        // initiating the payout.

        const payoutData = {
            account_number: "RAdVk2QMKX808v", // Your business's payout account
            fund_account: {
                account_type: "vpa",
                vpa: {
                    address: upiId
                },
                contact: {
                    // In a real app, you'd fetch this from the user's Firestore profile
                    name: "Recipient Name" 
                }
            },
            amount: amount, // Amount in paise
            currency: currency || "INR",
            mode: mode || "UPI",
            purpose: purpose || "payout",
            queue_if_low_balance: true // Important for reliability
        };
        
        const payout = await razorpay.payouts.create(payoutData);

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
                error: "Failed to process payout."
            })
        };
    }
};