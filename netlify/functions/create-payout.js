const Razorpay = require('razorpay');

// Get all keys from Netlify's environment variables
const { KEY_ID, KEY_SECRET, RAZORPAYX_ACCOUNT_NUMBER } = process.env;

// Initialize the Razorpay instance. This single instance is used for all operations.
const razorpay = new Razorpay({
    key_id: KEY_ID,
    key_secret: KEY_SECRET
});

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        console.log("Payout function triggered.");
        const { amount, upiId } = JSON.parse(event.body);
        const name = "Wallet User"; // Placeholder
        const email = "user@example.com"; // Placeholder

        if (!amount || !upiId || !RAZORPAYX_ACCOUNT_NUMBER) {
            console.error("Missing required fields. Amount, UPI ID, or Account Number is missing.");
            return { statusCode: 400, body: 'Missing required fields in request or environment.' };
        }
        
        // --- START OF THE ROBUST PAYOUT FLOW ---

        // Step 1: Create a Contact for the user.
        console.log("Step 1: Creating/fetching contact...");
        const contact = await razorpay.contacts.create({
            name: name,
            email: email,
            contact: "9999999999" // A placeholder phone is required by the API
        });
        console.log("Contact created/fetched successfully:", contact.id);

        // Step 2: Create a Fund Account (VPA) for that Contact.
        console.log("Step 2: Creating/fetching fund account for contact:", contact.id);
        const fundAccount = await razorpay.fundAccount.create({
            customer_id: contact.id,
            account_type: "vpa",
            vpa: {
                address: upiId
            }
        });
        console.log("Fund account created/fetched successfully:", fundAccount.id);

        // Step 3: Now that the Fund Account is guaranteed to exist, create the Payout.
        const payoutData = {
            account_number: RAZORPAYX_ACCOUNT_NUMBER,
            fund_account_id: fundAccount.id, // Use the ID of the fund account
            amount: amount, // Amount in paise
            currency: "INR",
            mode: "UPI",
            purpose: "payout",
            queue_if_low_balance: true
        };
        
        console.log("Step 3: Creating payout with data:", payoutData);
        
        // --- THIS IS THE CORRECTED API CALL ---
        // The payouts functionality is directly on the razorpay instance itself.
        const payout = await razorpay.payouts.create(payoutData);
        console.log("Payout initiated successfully:", payout);

        return {
            statusCode: 200,
            body: JSON.stringify({
                payoutId: payout.id,
                status: payout.status
            })
        };
        // --- END OF THE ROBUST PAYOUT FLOW ---

    } catch (error) {
        // This will now log the *specific* error from the Razorpay API
        console.error("--- PAYOUT FAILED ---");
        console.error("Error Status:", error.statusCode);
        console.error("Error Body:", error.error); // The detailed error from Razorpay
        console.error("--- END PAYOUT FAILED ---");
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Failed to process payout. Check server logs for details."
            })
        };
    }
};