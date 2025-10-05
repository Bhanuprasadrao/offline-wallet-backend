exports.handler = async (event) => {
    console.log("--- 'Hello World' function was triggered! ---");

    // This function simply returns a success message.
    // If this fails, the problem is with Netlify's environment, not our code.
    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Hello World! The function is running." })
    };
};