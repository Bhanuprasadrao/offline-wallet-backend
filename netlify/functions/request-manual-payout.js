const https = require('https');
const admin = require('firebase-admin');
const { nanoid } = require("nanoid");

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, YOUR_PERSONAL_PHONE_NUMBER, FIREBASE_ADMIN_SDK_CONFIG } = process.env;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(FIREBASE_ADMIN_SDK_CONFIG)),
  });
}
const db = admin.firestore();

// This helper function sends an SMS via Twilio's API. It is correct.
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
            if (res.statusCode >= 200 && res.statusCode < 300) { resolve(); } else {
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
        const { amount, upiId, name } = JSON.parse(event.body);

        if (!amount || !upiId || !name) {
            return { statusCode: 400, body: 'Missing required fields.' };
        }
        
        const amountInRupees = amount / 100.0;
        
        // --- THIS IS THE DEFINITIVE FIX ---
        
        // 1. Create the shortest possible, valid upi:// deeplink.
        const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amountInRupees}&cu=INR`;
        
        // --- THIS IS THE DEFINITIVE FIX ---
        const shortCode = nanoid(7); // Generate a 7-character random code
        
        // Save the mapping in Firestore
        await db.collection('shortlinks').doc(shortCode).set({
            originalUrl: upiLink,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        const siteUrl = process.env.URL;
        const shortUrl = `${siteUrl}/pay/${shortCode}`;
        
        const smsBody = `Pay ₹${amountInRupees} to ${name}: ${shortUrl}`;
        // --- END OF THE FIX ---
        
        await sendTwilioSms(YOUR_PERSONAL_PHONE_NUMBER, smsBody);
        return { statusCode: 200, body: JSON.stringify({ message: "Request sent." }) };

    } catch (error) {
        console.error("--- MANUAL PAYOUT SMS FAILED ---", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to process request. Check server logs." })
        };
    }
};