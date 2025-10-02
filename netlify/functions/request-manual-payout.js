const https = require('https');

// Get keys from Netlify's environment variables
const { PUSHOVER_USER_KEY, PUSHOVER_API_TOKEN, YOUR_PERSONAL_UPI_ID } = process.env;

// (The sendPushoverNotification helper function is correct and remains the same)
function sendPushoverNotification(title, message, url) {
    // ...
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // We need YOUR UPI ID from the environment to construct the link
        if (!YOUR_PERSONAL_UPI_ID) {
            throw new Error("Server configuration error: YOUR_PERSONAL_UPI_ID is not set.");
        }

        const { amount, upiId, name, transactionId } = JSON.parse(event.body);

        if (!amount || !upiId || !name || !transactionId) {
            return { statusCode: 400, body: 'Missing required fields.' };
        }
        
        const amountInRupees = amount / 100.0;
        
        // --- THIS IS THE DEFINITIVE FIX ---
        // We are constructing the most complete and compliant link possible for a P2P-style business transaction.
        
        // Your business category. '6012' is for Financial Institutions.
        const merchantCategoryCode = "6012";
        
        // A clear, unique transaction note.
        const transactionNote = `Wallet Payout. Ref: ${transactionId}`;
        
        // The final, compliant UPI deeplink.
        const upiLink = `upi://pay?` +
                      `pa=${upiId}` + // The person we are paying
                      `&pn=${encodeURIComponent(name)}` + // Their name
                      `&am=${amountInRupees}` + // The amount
                      `&cu=INR` + // Currency
                      `&tn=${encodeURIComponent(transactionNote)}` + // The note
                      `&tid=${transactionId}` + // The unique transaction ID
                      `&tr=${transactionId}` + // Transaction Reference (often same as tid)
                      `&mc=${merchantCategoryCode}`; // Your merchant category
        
        // --- END OF THE FIX ---
        
        const notificationTitle = `Withdrawal Request: ₹${amountInRupees}`;
        const notificationMessage = `Tap to pay ${name} (${upiId}).`;
        
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