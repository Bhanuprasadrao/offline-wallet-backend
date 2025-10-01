const https = require('https');

// Get keys from Netlify's environment variables
const { PUSHOVER_USER_KEY, PUSHOVER_API_TOKEN, YOUR_UPI_ID } = process.env;

// Helper function to send a notification via Pushover
function sendPushoverNotification(title, message, url) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            token: PUSHOVER_API_TOKEN,
            user: PUSHOVER_USER_KEY,
            title: title,
            message: message,
            url: url,
            url_title: "Tap to Pay"
        });

        const options = {
            hostname: 'api.pushover.net',
            path: '/1/messages.json',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            if (res.statusCode === 200) {
                resolve();
            } else {
                reject(`Pushover request failed with status: ${res.statusCode}`);
            }
        });
        req.on('error', (e) => reject(e));
        req.write(payload);
        req.end();
    });
}


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

        // 1. Create the clickable UPI deeplink
        const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amountInRupees}&cu=INR&tn=WalletWithdrawal`;
        
        // 2. Create the notification message
        const notificationTitle = `Withdrawal Request: ₹${amountInRupees}`;
        const notificationMessage = `Request from ${name} (${upiId}). Tap the link below to open your UPI app and complete the payment.`;
        
        // 3. Send the notification to your phone via Pushover
        await sendPushoverNotification(notificationTitle, notificationMessage, upiLink);

        // 4. Respond to the user's app
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Withdrawal request has been sent to the operator for manual approval." })
        };

    } catch (error) {
        console.error("--- MANUAL PAYOUT REQUEST FAILED ---", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to process request. Check server logs." })
        };
    }
};