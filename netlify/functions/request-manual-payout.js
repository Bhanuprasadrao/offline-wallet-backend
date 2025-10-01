const https = require('https');
const { PUSHOVER_USER_KEY, PUSHOVER_API_TOKEN } = process.env;

// (The sendPushoverNotification helper function remains the same)

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { amount, upiId, name } = JSON.parse(event.body);

        if (!amount || !upiId || !name) {
            return { statusCode: 400, body: 'Missing required fields.' };
        }
        
        const amountInRupees = amount / 100.0;
        
        // --- THIS IS THE CRITICAL FIX ---
        // 1. Define Your Merchant Category Code (MCC).
        // For a digital wallet / financial service, '6012' is a standard code.
        const merchantCategoryCode = "6012";

        // 2. Generate a unique Transaction Reference ID.
        const transactionRefId = `WDWL-${new Date().getTime()}`;
        
        // 3. Create the complete and compliant UPI deeplink.
        const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amountInRupees}&cu=INR&tn=Wallet Withdrawal&tr=${transactionRefId}&mc=${merchantCategoryCode}`;
        // --- END OF THE FIX ---
        
        const notificationTitle = `Withdrawal Request: ₹${amountInRupees}`;
        const notificationMessage = `Request from ${name} (${upiId}). Tap link to pay. Ref: ${transactionRefId}`;
        
        await sendPushoverNotification(notificationTitle, notificationMessage, upiLink);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Withdrawal request has been sent for manual approval." })
        };

    } catch (error) {
        console.error("--- MANUAL PAYOUT REQUEST FAILED ---", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to process request. Check server logs." })
        };
    }
};