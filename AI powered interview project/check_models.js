const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const apiKey = process.env.GOOGLEGEMINI_API_KEY || process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Dummy init
        // Actually typically we need a ModelService, but the SDK simplifies this.
        // Let's try to just hit the API with a simple direct check or use the proper listing method if SDK exposes it.
        // The SDK doesn't always expose listModels directly on the main class in older versions, 
        // but let's try a direct fetch if the SDK doesn't help.

        // Attempt to run a generation on a very standard model to see if it works
        console.log("Testing gemini-1.5-flash...");
        try {
            const m1 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            await m1.generateContent("Test");
            console.log("SUCCESS: gemini-1.5-flash");
        } catch (e) { console.log("FAIL: gemini-1.5-flash", e.message.split('[')[0]); }

        console.log("Testing gemini-pro...");
        try {
            const m2 = genAI.getGenerativeModel({ model: "gemini-pro" });
            await m2.generateContent("Test");
            console.log("SUCCESS: gemini-pro");
        } catch (e) { console.log("FAIL: gemini-pro", e.message.split('[')[0]); }

    } catch (e) {
        console.error(e);
    }
}

listModels();
