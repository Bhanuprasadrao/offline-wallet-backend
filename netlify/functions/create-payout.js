const https = require('https');

// Get all necessary keys from Netlify's secure environment variables
const { KEY_ID, KEY_SECRET, RAZORPAYX_ACCOUNT_NUMBER } = process.env;

// Helper function to make secure, authenticated API requests to Razorpay
function makeRazorpayRequest(options, payload) {
    return new Promise((resolve, reject) => {
        const auth = "Basic " + Buffer.from(KEY_ID + ":" + KEY_SECRET).toString("base64");
        const req = https.request({
            hostname: 'api.razorpay.com',
            ...options,
            headers: {
                'Authorization': auth,
                'Content-Type': 'application/json'
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const responseBody = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(responseBody);
                    } else {
                        // Forward the detailed error object from Razorpay
                        reject({
                            statusCode: res.statusCode,
                            error: responseBody.error
                        });
                    }
                } catch (e) {
                    reject({ statusCode: 500, error: { description: "Failed to parse Razorpay response." } });
                }
            });
        });

        req.on('error', (e) => reject(e));
        if (payload) {
            req.write(JSON.stringify(payload));
        }
        req.end();
    });
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        console.log("Payout function triggered.");
        const { amount, upiId, name, phone } = JSON.parse(event.body);

        if (!amount || !upiId || !name || !phone || !RAZORPAYX_ACCOUNT_NUMBER) {
            console.error("Missing required fields. Check request body and environment variables.");
            return { statusCode: 400, body: 'Missing required fields.' };
        }
        
        // Step 1: Create a Contact. This is idempotent.
        console.log("Step 1: Creating/fetching contact...");
        const contactPayload = { name, email: `${phone}@example.com`, contact: phone, type: "customer" };
        const contact = await makeRazorpayRequest({ path: '/v1/contacts', method: 'POST' }, contactPayload);
        console.log("Contact created/fetched successfully:", contact.id);

        // Step 2: Create a Fund Account (VPA) for that Contact.
        console.log("Step 2: Creating/fetching fund account...");
        const fundAccountPayload = {
            contact_id: contact.id,
            account_type: "vpa",
            vpa: { address: upiId }
        };
        const fundAccount = await makeRazorpayRequest({ path: '/v1/fund_accounts', method: 'POST' }, fundAccountPayload);
        console.log("Fund account created/fetched successfully:", fundAccount.id);

        // Step 3: Create the Payout.
        const payoutData = {
            account_number: RAZORPAYX_ACCOUNT_NUMBER,
            fund_account_id: fundAccount.id,
            amount: amount,
            currency: "INR",
            mode: "UPI",
            purpose: "payout",
            queue_if_low_balance: true
        };
        
        console.log("Step 3: Creating payout...");
        const payout = await makeRazorpayRequest({ path: '/v1/payouts', method: 'POST' }, payoutData);
        console.log("Payout initiated successfully:", payout);

        return {
            statusCode: 200,
            body: JSON.stringify({
                payoutId: payout.id,
                status: payout.status
            })
        };

    } catch (error) {
        console.error("--- PAYOUT FAILED ---");
        console.error("Error Status:", error.statusCode);
        console.error("Error Body:", JSON.stringify(error.error, null, 2));
        return {
            statusCode: error.statusCode || 500,
            body: JSON.stringify({
                error: "Failed to process payout. Check server logs for details."
            })
        };
    }
};