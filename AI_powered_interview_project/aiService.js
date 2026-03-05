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
        const textLen = p.length;

        let inferredSkills = ["Problem Solving", "Communication"];
        let suitableJobs = ["Software Developer"];
        let skillsToImprove = ["System Design", "Cloud Architecture"];
        let level = "Entry";
        let score = 50 + (textLen % 40); // pseudo-random score based on length

        if (p.includes("javascript") || p.includes("react")) inferredSkills.push("JavaScript", "React");
        if (p.includes("python") || p.includes("django")) inferredSkills.push("Python", "Django");
        if (p.includes("java") || p.includes("spring")) inferredSkills.push("Java", "Spring Boot");
        if (p.includes("aws") || p.includes("cloud")) inferredSkills.push("AWS", "Cloud Computing");

        if (textLen > 3000) { level = "Senior"; suitableJobs.push("Senior Engineer"); }
        else if (textLen > 1500) { level = "Mid"; suitableJobs.push("Mid-level Developer"); }

        if (inferredSkills.length <= 2) {
            inferredSkills.push("HTML/CSS", "Git");
            skillsToImprove.push("Advanced Frameworks", "Backend Development");
        }

        return {
            summary: `This is a generated analysis (Smart Mock) based on a resume of approx ${textLen} characters. The candidate appears to be at a ${level} level.`,
            level: level,
            skills: inferredSkills,
            questions: [
                `Can you tell me about your experience with ${inferredSkills[1] || "your main skill"}?`,
                "Describe a challenging bug you fixed recently.",
                "How do you prioritize tasks under tight deadlines?"
            ],
            score: score > 100 ? 98 : score,
            suggestions: [
                "Consider adding more concrete metrics and outcomes to your project descriptions.",
                "Ensure your formatting is consistent throughout.",
                "Highlight key achievements rather than just responsibilities."
            ],
            suitable_jobs: suitableJobs,
            skills_to_improve: skillsToImprove
        };
    }

    // --- MODE 2: EVALUATION (Server asking to score an answer) ---
    if (p.includes("evaluate this answer")) {
        console.warn("⚠️ SmartMock returning simulated evaluation feedback.");

        // Safely extract the question
        const questionMatch = prompt.match(/Question:\s*"([^]*?)"\s*\n/i) || prompt.match(/Question:\s*"([^]*?)"/i);
        const questionText = questionMatch ? questionMatch[1].trim().toLowerCase() : "";

        // Safely extract the user answer
        const answerMatch = prompt.match(/User Answer:\s*"([^]*?)"\s*Instructions/i) || prompt.match(/User Answer:\s*([\s\S]*?)\s*Instructions/i) || prompt.match(/User Answer:\s*"([^]*?)"/i);
        const userAnswer = answerMatch ? (answerMatch[1] || answerMatch[2] || answerMatch[3] || "").trim() : "";

        const len = userAnswer.length;
        const lowerAnswer = userAnswer.toLowerCase();

        let score = 5;
        let feedback = "Your answer covers the basics, but could include more specific examples.";

        let isCorrect = false;
        if (questionText.includes("react")) {
            if (lowerAnswer.includes("ui") || lowerAnswer.includes("component") || lowerAnswer.includes("dom") || lowerAnswer.includes("hook") || lowerAnswer.includes("state")) isCorrect = true;
        } else if (questionText.includes("node") || questionText.includes("express")) {
            if (lowerAnswer.includes("event") || lowerAnswer.includes("async") || lowerAnswer.includes("javascript") || lowerAnswer.includes("server") || lowerAnswer.includes("runtime")) isCorrect = true;
        } else if (questionText.includes("java") && !questionText.includes("javascript")) {
            if (lowerAnswer.includes("object") || lowerAnswer.includes("class") || lowerAnswer.includes("thread") || lowerAnswer.includes("garbage") || lowerAnswer.includes("jvm") || lowerAnswer.includes("interface")) isCorrect = true;
        } else if (questionText.includes("javascript") || questionText.includes("js")) {
            if (lowerAnswer.includes("let") || lowerAnswer.includes("const") || lowerAnswer.includes("closure") || lowerAnswer.includes("promise") || lowerAnswer.includes("async")) isCorrect = true;
        } else if (questionText.includes("python")) {
            if (lowerAnswer.includes("interpret") || lowerAnswer.includes("gil") || lowerAnswer.includes("list") || lowerAnswer.includes("decorator") || lowerAnswer.includes("indent")) isCorrect = true;
        } else if (questionText.includes("sql") || questionText.includes("database")) {
            if (lowerAnswer.includes("table") || lowerAnswer.includes("index") || lowerAnswer.includes("join") || lowerAnswer.includes("query") || lowerAnswer.includes("acid")) isCorrect = true;
        } else if (questionText.includes("aws") || questionText.includes("cloud")) {
            if (lowerAnswer.includes("amazon") || lowerAnswer.includes("ec2") || lowerAnswer.includes("s3") || lowerAnswer.includes("server") || lowerAnswer.includes("lambda")) isCorrect = true;
        } else if (len > 30) {
            isCorrect = true;
        }

        if (len < 15) {
            score = 3;
            feedback = `Your answer is way too brief. Try to elaborate on the technical aspects and provide concrete examples next time.`;
        } else if (isCorrect) {
            score = len > 80 ? 9 : 7;
            feedback = `Good job. Your explanation is technically accurate and well-reasoned. Keep up the thorough answers!`;
        } else {
            score = 4;
            feedback = `Your answer doesn't seem to fully address the core concepts of the question. Try to focus on the key technologies discussed.`;
        }

        return {
            reasoning: "Simulated mock reasoning since AI API is unavailable.",
            score: score,
            feedback: feedback,
            category: "Technical"
        };
    }

    // --- MODE 2: GENERATE QUESTION (Server asking for next question) ---
    if (p.includes("generate the next interview question")) {
        // Extract details from context
        const topicMatch = prompt.match(/Topic:\s*(.*)/i);
        const extractedTopic = topicMatch ? topicMatch[1].trim() : "";
        const roleMatch = prompt.match(/Job Role:\s*(.*)/i);
        const extractedRole = roleMatch ? roleMatch[1].trim() : "";
        const skillsMatch = prompt.match(/- Detected Skills:\s*(.*)/i);
        const extractedSkills = skillsMatch ? skillsMatch[1].trim() : "";

        const combinedContext = `${extractedTopic} ${extractedRole} ${extractedSkills}`.toLowerCase();

        // Topic mappings
        const specificQuestions = {
            "react": [
                "What are React Hooks and why do we use them?",
                "Can you explain the difference between state and props?",
                "How does the virtual DOM work in React?"
            ],
            "node.js": [
                "How does the Event Loop work in Node.js?",
                "What is the purpose of middleware in Express.js?",
                "Explain how streams work in Node.js."
            ],
            "node": [
                "How does the Event Loop work in Node.js?",
                "What is the purpose of middleware in Express.js?",
                "Explain how streams work in Node.js."
            ],
            "javascript": [
                "Explain the difference between let, const, and var.",
                "What is a closure in JavaScript?",
                "Can you explain promises and async/await?"
            ],
            "java": [
                "What is the difference between an interface and an abstract class?",
                "Explain the concept of multithreading in Java.",
                "How does Garbage Collection work in Java?"
            ],
            "python": [
                "What are decorators in Python and how do you use them?",
                "Can you explain the difference between lists and tuples?",
                "What is the Global Interpreter Lock (GIL) in Python?"
            ],
            "sql": [
                "What is the difference between a LEFT JOIN and an INNER JOIN?",
                "Explain what indexing is in a database.",
                "How do you optimize a slow-running SQL query?"
            ],
            "database": [
                "What is the difference between SQL and NoSQL?",
                "Explain what indexing is in a database.",
                "How do you define ACID properties?"
            ],
            "aws": [
                "What is the difference between an EC2 instance and a serverless Lambda function?",
                "Can you explain what an S3 bucket is and how to secure it?",
                "How do you use IAM to control AWS resources?"
            ]
        };

        let chosenQuestion = "";

        // Find matching topic in our mapping
        const topicKey = Object.keys(specificQuestions).find(key => combinedContext.includes(key));

        if (topicKey) {
            const list = specificQuestions[topicKey];
            const index = prompt.length % list.length;
            chosenQuestion = list[index];
        } else {
            const displayTopic = extractedTopic || extractedRole || "your area of expertise";
            const fallbackTopics = [
                `Can you explain a complex concept related to ${displayTopic}?`,
                `What are the best practices for working with ${displayTopic}?`,
                `Describe a challenging problem you solved using ${displayTopic}.`,
                `If you were designing a scalable architecture for a system involving ${displayTopic}, what key factors would you consider?`,
                `Can you tell me about the most difficult bug you've had to fix in ${displayTopic}?`
            ];
            const index = prompt.length % fallbackTopics.length;
            chosenQuestion = fallbackTopics[index];
        }

        return {
            message: chosenQuestion,
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

    // Check if this is an evaluation call
    const isEvaluation = userPrompt.toLowerCase().includes("evaluate this answer");
    if (isEvaluation) {
        console.log("📝 Mode: Evaluation");
    }

    // 1. Validate Key
    if (!genAI) {
        console.warn("⚠️ No API Key found. Switching to Smart Mock mode.");
        return getSmartMockResponse(userPrompt);
    }

    // 2. Try Real API
    const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"];

    for (const modelName of modelsToTry) {
        try {
            console.log(`🔄 Attempting Model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const fullPrompt = `${systemMsg}\n\nTask: ${userPrompt}\n\nIMPORTANT: Return ONLY valid JSON. No markdown formatting.`;

            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            const text = response.text();

            if (isEvaluation) {
                console.log(`🧠 Raw AI Response from ${modelName}:\n`, text);
            }

            const parsed = attemptParseJSON(text);
            if (isEvaluation) {
                console.log(`🔍 JSON Parsing Result for ${modelName}:`, parsed);
            }
            if (parsed) {
                console.log(`✅ Success with ${modelName}`);
                return parsed;
            } else {
                if (isEvaluation) {
                    console.error("❌ JSON parsing failed for response:", text);
                }
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
