const https = require('https');

// Get Twilio credentials and your personal phone number from Netlify's environment variables
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, YOUR_PERSONAL_PHONE_NUMBER } = process.env;

// This helper function sends an SMS via Twilio's API
function sendTwilioSms(to, body) {
    return new Promise((resolve, reject) => {
        if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER || !YOUR_PERSONAL_PHONE_NUMBER) {
            return reject("Twilio credentials are not fully configured on the server.");
        }

        const payload = new URLSearchParams({
            To: to,
            From: TWILIO_PHONE_NUMBER,
            Body: body,
        }).toString();

        const auth = "Basic " + Buffer.from(TWILIO_ACCOUNT_SID + ":" + TWILIO_AUTH_TOKEN).toString("base64");

        const options = {
            hostname: 'api.twilio.com',
            path: `/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
            method: 'POST',
            headers: {
                'Authorization': auth,
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        };

        const req = https.request(options, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve();
            } else {
                let errorData = '';
                res.on('data', (d) => { errorData += d; });
                res.on('end', () => {
                    console.error('Twilio error response:', errorData);
                    reject(`Twilio request failed with status: ${res.statusCode}`);
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
        const { amount, upiId, name, transactionId } = JSON.parse(event.body);

        if (!amount || !upiId || !name || !transactionId) {
            return { statusCode: 400, body: 'Missing required fields.' };
        }
        
        const amountInRupees = amount / 100.0;
        const transactionNote = `Wallet Payout. Ref: ${transactionId}`;
        
        const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amountInRupees}&cu=INR&tn=${encodeURIComponent(transactionNote)}&tid=${transactionId}&tr=${transactionId}&mc=6012`;
        
        // --- THIS IS THE DEFINITIVE FIX ---
        // 1. Get the site's URL from Netlify's automatic environment variables.
        const siteUrl = process.env.URL;

        if (!siteUrl) {
            throw new Error("Could not determine the site URL. Ensure the 'URL' environment variable is available in your Netlify build settings.");
        }
        
        // 2. Create the full, universally clickable https:// redirect link.
        // We encode the upiLink to make it safe to use as a URL parameter.
        const redirectLink = `${siteUrl}/.netlify/functions/redirect-to-upi?url=${encodeURIComponent(upiLink)}`;
        
        // 3. Create the SMS body with the new https link.
        const smsBody = `Pay ₹${amountInRupees} to ${name}: ${redirectLink}`;
        // --- END OF THE FIX ---
        
        await sendTwilioSms(YOUR_PERSONAL_PHONE_NUMBER, smsBody);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Withdrawal request has been sent for manual approval." })
        };

    } catch (error) {
        console.error("--- MANUAL PAYOUT SMS FAILED ---", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to process request. Check server logs." })
        };
    }
};