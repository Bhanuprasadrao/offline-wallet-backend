const https = require('https');

const { PUSHOVER_USER_KEY, PUSHOVER_API_TOKEN } = process.env;

// This helper function sends the notification to your phone.
function sendPushoverNotification(title, message, url) {
    return new Promise((resolve, reject) => {
        if (!PUSHOVER_API_TOKEN || !PUSHOVER_USER_KEY) {
            return reject("Pushover API Token or User Key is not configured on the server.");
        }

        const payload = JSON.stringify({
            token: PUSHOVER_API_TOKEN,
            user: PUSHOVER_USER_KEY,
            title: title,
            message: message,
            url: url,
            url_title: "Tap Here to Pay"
        });

        const options = {
            hostname: 'api.pushover.net',
            path: '/1/messages.json',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
        };

        const req = https.request(options, (res) => {
            if (res.statusCode === 200) {
                resolve();
            } else {
                let errorData = '';
                res.on('data', (d) => { errorData += d; });
                res.on('end', () => {
                    console.error('Pushover error response:', errorData);
                    reject(`Pushover request failed with status: ${res.statusCode}`);
                });
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
        // --- THIS IS THE FIX ---
        // We now receive a unique transaction ID from the app.
        const { amount, upiId, name, transactionId } = JSON.parse(event.body);

        if (!amount || !upiId || !name || !transactionId) {
            return { statusCode: 400, body: 'Missing required fields.' };
        }
        
        const amountInRupees = amount / 100.0;
        
        // Create a more descriptive transaction note.
        const transactionNote = `Wallet Payout to ${name}. Ref: ${transactionId}`;
        
        // Create the complete and compliant UPI deeplink with a unique 'tid'.
        const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amountInRupees}&cu=INR&tn=${encodeURIComponent(transactionNote)}&tid=${transactionId}`;
        
        const notificationTitle = `Withdrawal Request: ₹${amountInRupees}`;
        const notificationMessage = `Pay ${name} (${upiId}).`;
        
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