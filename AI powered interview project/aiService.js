const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- Configuration ---
// Priority: 1. Hardcoded (User Provided) 2. Env Variable
const USER_PROVIDED_KEY = "AIzaSyC8RAD9nXCz-4EeQJ365d2u4Jt-t1rjTTk";
const apiKey = USER_PROVIDED_KEY || process.env.GOOGLEGEMINI_API_KEY || process.env.GEMINI_API_KEY;

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Smart Mock Engine
 * Simulates an AI interviewer if the real API fails.
 */
function getSmartMockResponse(prompt) {
    const p = prompt.toLowerCase();

    // --- MODE 1: RESUME ANALYSIS (Server asking to analyze resume) ---
    if (p.includes("analysis of this resume") || p.includes("analyze this resume")) {
        return {
            summary: "This is a generated analysis (Smart Mock) because the AI service is unavailable or returned an error. The candidate appears to have experience in software development.",
            level: "Intermediate",
            skills: ["JavaScript", "HTML/CSS", "Node.js", "React", "Problem Solving"],
            questions: [
                "Explain the Virtual DOM in React.",
                "How do you handle asynchronous operations in JavaScript?",
                "Describe a challenging project you worked on."
            ],
            score: 75,
            suggestions: [
                "Deepen your knowledge of System Design patterns.",
                "Consider learning TypeScript for type safety.",
                "Add more metrics to your project descriptions."
            ]
        };
    }

    // --- MODE 2: EVALUATION (Server asking to score an answer) ---
    if (p.includes("evaluate this answer")) {
        // Extract the user's actual answer from the prompt string
        // Format: Evaluate this answer: "USER_TEXT".
        const match = prompt.match(/Evaluate this answer: "(.*)"/);
        const userMsg = match ? match[1].toLowerCase() : "";

        let score = 5;
        let feedback = "Okay answer.";

        if (userMsg.length < 5) {
            score = 2;
            feedback = "Your answer provides no detail. Please elaborate.";
        } else if (userMsg.includes("java") || userMsg.includes("react") || userMsg.includes("node")) {
            score = 8;
            feedback = "Good use of technical terminology.";
        } else if (userMsg.includes("because") || userMsg.includes("example")) {
            score = 7;
            feedback = "Good reasoning provided.";
        }

        return {
            score: score,
            feedback: feedback,
            category: "Technical"
        };
    }

    // --- MODE 2: GENERATE QUESTION (Server asking for next question) ---
    if (p.includes("generate the next interview question")) {
        // Avoid "Start" logic here to prevent loops.
        // Just pick a relevant question based on topic if possible, or random.

        const topics = [
            "Explain the difference between let, const, and var.",
            "How does the Event Loop work in Node.js?",
            "What are React Hooks and why do we use them?",
            "Explain the concept of RESTful APIs.",
            "What is the difference between SQL and NoSQL?",
            "How do you optimize a website for performance?",
            "Explain dependency injection.",
            "What is a closure in JavaScript?"
        ];

        // Pseudo-random selection based on prompt length to vary it slightly
        const index = prompt.length % topics.length;

        return {
            message: topics[index],
            feedback: "Moving to next topic.",
            score: 0
        };
    }

    // --- MODE 3: DIRECT CHAT / FALLBACK ---
    // This handles cases where prompt IS the user message (not wrapped by Server)

    // Logic for "Start"
    if (p.includes("start") || p.includes("begin") || p.includes("hello")) {
        return {
            message: "Great! Let's get started. Please introduce yourself and highlight your key technical skills.",
            score: 0,
            feedback: "Introduction phase."
        };
    }

    return {
        message: "That's interesting. Can you tell me more about your experience with backend testing?",
        score: 5,
        feedback: "General probe.",
        error: null
    };
}

/**
 * Robust JSON Parser
 */
function attemptParseJSON(text) {
    try {
        return JSON.parse(text);
    } catch (e1) {
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        try { return JSON.parse(cleanText); } catch (e2) {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try { return JSON.parse(jsonMatch[0]); } catch (e3) { return null; }
            }
            return null;
        }
    }
}

/**
 * Calls the AI Service (Google Gemini) with Smart Fallback
 */
async function callAI(userPrompt, systemMsg = "You are an expert technical interviewer.") {
    console.log("🚀 AI Service Called...");

    // 1. Validate Key
    if (!genAI) {
        console.warn("⚠️ No API Key found. Using Smart Mock.");
        return getSmartMockResponse(userPrompt);
    }

    // 2. Try Real API
    const modelsToTry = ["gemini-1.5-flash", "gemini-2.0-flash-exp", "gemini-pro"];

    for (const modelName of modelsToTry) {
        try {
            console.log(`🔄 Attempting Model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const fullPrompt = `${systemMsg}\n\nTask: ${userPrompt}\n\nIMPORTANT: Return ONLY valid JSON. No markdown formatting.`;

            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            const text = response.text();

            const parsed = attemptParseJSON(text);
            if (parsed) {
                console.log(`✅ Success with ${modelName}`);
                return parsed;
            }
        } catch (error) {
            console.error(`❌ Failed with ${modelName}:`, error.message);
            // Continue loop
        }
    }

    // 3. Fallback to Smart Mock if ALL API attempts fail
    console.warn("⚠️ All AI models failed. Switching to Smart Mock mode.");
    return getSmartMockResponse(userPrompt);
}

module.exports = { callAI };
