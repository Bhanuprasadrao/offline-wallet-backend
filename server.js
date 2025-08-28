const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');

// Initialize the Express app
const app = express();

// Middlewares to handle JSON body parsing and allow Cross-Origin Resource Sharing
app.use(express.json());
app.use(cors());

// --- CRITICAL: Securely load your Razorpay keys ---
// This code will read from the Environment Variables you set on Render.
// Do NOT paste your keys directly here.
const KEY_ID = process.env.KEY_ID;
const KEY_SECRET = process.env.KEY_SECRET;

// Check if keys are provided
if (!KEY_ID || !KEY_SECRET) {
    console.error("FATAL ERROR: Razorpay KEY_ID and KEY_SECRET are not configured in environment variables.");
    process.exit(1); // Exit the process if keys are missing
}

// Initialize the Razorpay client instance
const razorpay = new Razorpay({
    key_id: KEY_ID,
    key_secret: KEY_SECRET
});

/**
 * API Endpoint: /create-order
 * Method: POST
 * Body: { "amount": number, "currency": "INR" }
 * Description: Creates a Razorpay payment order.
 */
app.post('/create-order', async (req, res) => {
    // Get the amount and currency from the request body sent by the Android app.
    const { amount, currency } = req.body;

    // Basic validation to ensure the app sent valid data.
    if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount provided. Amount must be a positive number." });
    }

    const options = {
        amount: amount, // Amount in the smallest currency unit (e.g., paise for INR)
        currency: currency || "INR", // Default to INR if not provided
        receipt: `receipt_order_${new Date().getTime()}`
    };

    try {
        // Ask the Razorpay SDK to create the order.
        const order = await razorpay.orders.create(options);

        if (!order) {
            return res.status(500).json({ error: "Error creating order with payment provider." });
        }
        
        console.log("Successfully created order:", order);
        // Send the essential details back to the Android app.
        res.status(200).json({ orderId: order.id, amount: order.amount });

    } catch (err) {
        console.error("Error in /create-order endpoint:", err);
        res.status(500).json({ error: err.message || "An internal server error occurred." });
    }
});

// --- THE CRITICAL FIX: Dynamic Port Binding ---
// Render will provide a PORT environment variable. We must use it.
// If we are running the file locally, it will fall back to using port 3000.
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running successfully on port ${PORT}`);
});