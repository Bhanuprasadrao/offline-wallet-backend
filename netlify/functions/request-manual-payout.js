// --- THIS IS THE PRIMARY FIX ---
// The module name is 'https', without any extra characters.
const https = require('https');
// ----------------------------

const { PUSHOVER_USER_KEY, PUSHOVER_API_TOKEN, YOUR_UPI_ID, YOUR_NAME} = process.env;

// This helper function sends the notification to your phone.
function sendPushoverNotification(title, message, url) {
    return new Promise((resolve, reject) => {
        // Double-check that the required environment variables are present.
        if (!PUSHOVER_API_TOKEN || !PUSHOVER_USER_KEY) {
            return reject("Pushover API Token or User Key is not configured on the server.");
        }

        const payload = JSON.stringify({
            token: PUSHOVER_API_TOKEN,
            user: PUSHOVER_USER_KEY,
            title: title,
            message: message,
            url: url,
            url_title: "Tap to Pay in UPI App"
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
                let errorData = '';
                res.on('data', (d) => {
                    errorData += d;
                });
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
        const { amount, upiId, name } = JSON.parse(event.body);

        if (!amount || !upiId || !name || !YOUR_UPI_ID || !YOUR_NAME) {
            return { statusCode: 400, body: 'Missing required fields.' };
        }
        
        const amountInRupees = amount / 100.0;
        
        // Create the complete and compliant UPI deeplink.
        const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amountInRupees}&cu=INR&tn=Wallet Withdrawal Approval&mode=04&purpose=00&cuid=${YOUR_UPI_ID}&cuname=${encodeURIComponent(YOUR_NAME)}`;        
        const notificationTitle = `Approval Request: ₹${amountInRupees}`;
        const notificationMessage = `Tap to request withdrawal approval from ${name}.`;
        
        // Send the notification to your phone.
        await sendPushoverNotification(notificationTitle, notificationMessage, upiLink);

        // Respond to the user's app.
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Withdrawal request has been sent for operator approval." })
        };

    } catch (error) {
        console.error("--- MANUAL PAYOUT REQUEST FAILED ---", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to process request. Check server logs." })
        };
    }
};