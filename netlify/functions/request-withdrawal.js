const https = require('https');
const { nanoid } = require("nanoid");
// --- THIS IS THE ONLY FIREBASE-RELATED LINE ---
const { admin, db } = require('./firebase-admin-helper');

const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER,
    YOUR_PERSONAL_PHONE_NUMBER
} = process.env;

function sendTwilioSms(to, body) {
    return new Promise((resolve, reject) => {
        if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER || !YOUR_PERSONAL_PHONE_NUMBER) {
            return reject("Twilio credentials are not fully configured on the server.");
        }
        const payload = new URLSearchParams({ To: to, From: TWILIO_PHONE_NUMBER, Body: body }).toString();
        const auth = "Basic " + Buffer.from(TWILIO_ACCOUNT_SID + ":" + TWILIO_AUTH_TOKEN).toString("base64");
        const options = {
            hostname: 'api.twilio.com',
            path: `/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
            method: 'POST',
            headers: { 'Authorization': auth, 'Content-Type': 'application/x-www-form-urlencoded' }
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
            return { statusCode: 400, body: "Missing required fields." };
        }
        
        const amountInRupees = amount / 100.0;
        const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amountInRupees}&tr=${transactionId}&tn=Wallet%20Withdrawal&cu=INR`;
        
        const shortCode = nanoid(8);
        
        console.log(`Saving shortlink. Code: [${shortCode}]`);
        const docRef = db.collection('shortlinks').doc(shortCode);
        
        // --- THIS LINE WILL NOW WORK CORRECTLY ---
        // Because the 'admin' object is now correctly imported.
        await docRef.set({
            originalUrl: upiLink,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log("Shortlink saved successfully.");

        // The rest of your logic is correct...
        const siteUrl = process.env.URL;
        const shortUrl = `${siteUrl}/r/${shortCode}`;
        const smsBody = `Withdrawal Request: Pay ₹${amountInRupees} to ${name}. Link: ${shortUrl}`;
        
        await sendTwilioSms(YOUR_PERSONAL_PHONE_NUMBER, smsBody);
        console.log("SMS sent successfully.");

        return { statusCode: 200, body: JSON.stringify({ message: "Request has been sent for processing." }) };
    } catch (error) {
        console.error("--- WITHDRAWAL REQUEST FAILED ---", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to process request. Check server logs." })
        };
    }
};