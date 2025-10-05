// This test will check if all our required modules and environment variables can be loaded.

exports.handler = async (event) => {
    try {
        console.log("--- Starting Dependency Check ---");

        // Test 1: Load standard Node.js modules
        const https = require('https');
        console.log("✅ 'https' module loaded successfully.");

        // Test 2: Load npm packages
        const { nanoid } = require("nanoid");
        console.log("✅ 'nanoid' module loaded successfully.");

        // Test 3: Load our local helper file and test Firebase init
        const { db } = require('./firebase-admin-helper');
        console.log("✅ 'firebase-admin-helper' loaded successfully.");
        if (!db) throw new Error("Firestore 'db' instance is null or undefined after import.");
        console.log("✅ Firestore 'db' instance is valid.");
        
        // Test 4: Check for all required environment variables
        const {
            TWILIO_ACCOUNT_SID,
            TWILIO_AUTH_TOKEN,
            TWILIO_PHONE_NUMBER,
            YOUR_PERSONAL_PHONE_NUMBER,
            FIREBASE_ADMIN_SDK_CONFIG
        } = process.env;

        if (!TWILIO_ACCOUNT_SID) throw new Error("Environment variable 'TWILIO_ACCOUNT_SID' is missing.");
        if (!TWILIO_AUTH_TOKEN) throw new Error("Environment variable 'TWILIO_AUTH_TOKEN' is missing.");
        if (!TWILIO_PHONE_NUMBER) throw new Error("Environment variable 'TWILIO_PHONE_NUMBER' is missing.");
        if (!YOUR_PERSONAL_PHONE_NUMBER) throw new Error("Environment variable 'YOUR_PERSONAL_PHONE_NUMBER' is missing.");
        if (!FIREBASE_ADMIN_SDK_CONFIG) throw new Error("Environment variable 'FIREBASE_ADMIN_SDK_CONFIG' is missing.");
        
        console.log("✅ All required environment variables are present.");
        console.log("--- Dependency Check Succeeded ---");

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Test 2 Succeeded. All dependencies and environment variables are loaded correctly." })
        };

    } catch (error) {
        console.error("--- DEPENDENCY CHECK FAILED ---");
        console.error("The crash is caused by this error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Dependency check failed. See server logs for details." })
        };
    }
};