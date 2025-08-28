const Razorpay = require('razorpay');

const { KEY_ID, KEY_SECRET } = process.env;

const razorpay = new Razorpay({
    key_id: KEY_ID,
    key_secret: KEY_SECRET
});

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        console.log("Withdrawal link function triggered.");
        const { amount, upiId, name, phone } = JSON.parse(event.body);

        if (!amount || !upiId || !name || !phone) {
            return { statusCode: 400, body: 'Missing required fields.' };
        }

        const linkRequest = {
            amount: amount, // in paise
            currency: "INR",
            accept_partial: false,
            description: "Token Withdrawal",
            customer: {
                name: name,
                contact: phone
            },
            notify: {
                sms: true, // Razorpay can notify the user
            },
            reminder_enable: false,
            callback_url: "https://yourapp.com/webhook", // A placeholder URL
            callback_method: "get"
        };
        
        console.log("Creating payment link with data:", linkRequest);
        const paymentLink = await razorpay.paymentLink.create(linkRequest);
        console.log("Payment link created:", paymentLink);

        // We need to create a UPI-specific link from this
        const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount / 100.0}&tid=${paymentLink.id}&tr=${paymentLink.id}&tn=Withdrawal&cu=INR`;
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                paymentLinkId: paymentLink.id,
                upiLink: upiLink // This is what the app will open
            })
        };

    } catch (error) {
        console.error("--- WITHDRAWAL FAILED ---");
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Failed to create withdrawal link. Check server logs."
            })
        };
    }
};