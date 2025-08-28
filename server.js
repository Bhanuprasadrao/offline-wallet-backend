const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Use environment variables for security
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Endpoint to create a payment order
app.post('/create-order', async (req, res) => {
    const { amount, currency = "INR" } = req.body;

    const options = {
        amount, // amount in paise
        currency,
        receipt: `receipt_order_${Date.now()}`
    };

    try {
        const order = await razorpay.orders.create(options);
        console.log("Order created:", order);
        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency
        });
    } catch (err) {
        console.error("Error in /create-order:", err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
