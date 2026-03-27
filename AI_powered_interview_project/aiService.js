const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- Configuration ---
// Priority: 1. Hardcoded (User Provided) 2. Env Variable
const USER_PROVIDED_KEY = "";
const apiKey = USER_PROVIDED_KEY || process.env.GOOGLEGEMINI_API_KEY || process.env.GEMINI_API_KEY;

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Smart Mock Engine
 * Simulates an AI interviewer if the real API fails.
 */
function getSmartMockResponse(prompt) {
    const p = prompt.toLowerCase();
    // --- MODE: AI SKILL SUGGESTION REPORT ---
if (p.includes("report mode")) {
    return {
        text: `
Recommended Skills:
- Data Structures & Algorithms
- Backend Development (Node.js)
- Database Design (SQL)


Courses:
- Data Structures & Algorithms (Coursera)
- Backend Development with Node.js (Udemy)
- SQL for Beginners (YouTube)

Roadmap:
1. Strengthen DSA fundamentals
2. Learn backend development (Node.js/Express)
3. Practice building REST APIs
4. Learn databases and system design

💡 Tips:
- Practice coding daily
- Build real-world projects


Motivation:
Consistency beats talent. Keep improving every day!
`
    };
}

    // --- MODE 0: PERSONALITY ANALYZER ---
    if (p.includes("analyze this candidate's personality") || p.includes("personality and communication style")) {
        const inputMatch = prompt.match(/Candidate Input:\s*"?([^]*?)"?\s*Task:/i);
        const inputText = inputMatch ? inputMatch[1].trim() : prompt;
        const len = inputText.length;
        const lowerInput = inputText.toLowerCase();
        
        // 1. Gibberish / Single Long String Check
        if (!lowerInput.includes(" ") && len > 20) {
            return {
                summary: "This is a simulated analysis (Smart Mock). The input appears to be an unstructured, continuous block of text without proper spacing.",
                traits: { Confidence: 10, Clarity: 5, Positivity: 10, ProblemSolving: 5 }
            };
        }

        // 2. Lack of Coherent Structure Check (checking for basic vowels or common structural words)
        const hasVowels = /[aeiouy]/.test(lowerInput);
        const splitWords = lowerInput.split(/\s+/);
        const avgWordLen = len / (splitWords.length || 1);
        
        if (!hasVowels || avgWordLen > 15 || avgWordLen < 3) {
            return {
                summary: "This is a simulated analysis (Smart Mock). The input appears to be randomly typed characters or lacks coherent linguistic structure.",
                traits: { Confidence: 15, Clarity: 10, Positivity: 20, ProblemSolving: 10 }
            };
        }

        let confidence = 65;
        let clarity = 65;
        let positivity = 70;
        let problemSolving = 60;

        if (len > 150) {
            confidence = 88; clarity = 85; positivity = 90; problemSolving = 85;
        } else if (len > 70) {
            confidence = 78; clarity = 75; positivity = 80; problemSolving = 72;
        }

        if (lowerInput.includes("problem") || lowerInput.includes("solve") || lowerInput.includes("bug") || lowerInput.includes("code")) {
            problemSolving += 15;
            clarity += 5;
        }
        if (lowerInput.includes("help") || lowerInput.includes("team") || lowerInput.includes("collaborate") || lowerInput.includes("together")) {
            positivity += 12;
        }
        if (lowerInput.includes("confident") || lowerInput.includes("sure") || lowerInput.includes("definitely") || lowerInput.includes("strong")) {
            confidence += 10;
        }

        return {
            summary: "This is a simulated analysis (Smart Mock). The candidate shows adaptability and good communication based on text length and keyword patterns.",
            traits: {
                Confidence: Math.min(100, confidence),
                Clarity: Math.min(100, clarity),
                Positivity: Math.min(100, positivity),
                ProblemSolving: Math.min(100, problemSolving)
            }
        };
    }

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
    if (p.includes("evaluate this answer") || p.includes("evaluate the candidate's answer") || p.includes("evaluate the candidate’s answer")) {
        console.warn("⚠️ SmartMock returning simulated evaluation feedback.");

        // Safely extract the question
        const questionMatch = prompt.match(/Question:\s*"?([^]*?)"?\s*\n/i);
        const questionText = questionMatch ? questionMatch[1].trim().toLowerCase() : "";

        // Safely extract the user answer
        let userAnswer = "";
        const answerMatch1 = prompt.match(/User Answer:\s*"?([^]*?)"?\s*Instructions/i);
        const answerMatch2 = prompt.match(/Answer:\s*([\s\S]*)/i); // For HR
        
        if (answerMatch1) {
            userAnswer = answerMatch1[1].trim();
        } else if (answerMatch2) {
            userAnswer = answerMatch2[1].trim();
        }

        // Strip off HR prompt boilerplate if present
        userAnswer = userAnswer.replace(/Evaluation criteria:[\s\S]*/i, "").trim();

        const len = userAnswer.length;
        const lowerAnswer = userAnswer.toLowerCase();

        let score = 5;
        let feedback = "Your answer covers the basics, but could include more specific examples.";

        // --- Gibberish / Invalid Input Detection (Global for all modules) ---
        const words = userAnswer.split(/\s+/).filter(w => w.length > 0);
        const wordCount = words.length;
        const avgWordLength = len / (wordCount || 1);
        const hasVowels = /[aeiouy]/i.test(userAnswer);
        const uniqueChars = new Set(userAnswer.toLowerCase().replace(/\s/g, '')).size;
        const repeatedCharRatio = uniqueChars / (userAnswer.replace(/\s/g, '').length || 1);

        // Check for gibberish: no vowels, single repeated chars, very long "words", or too few unique chars
        const isGibberish = !hasVowels || avgWordLength >= 10 || (repeatedCharRatio < 0.3 && len > 8) || (wordCount <= 2 && len >= 15 && avgWordLength >= 10);

        // Check if answer has real English words (at least some common ones)
        const commonWords = ['i', 'me', 'the', 'a', 'is', 'am', 'my', 'in', 'to', 'and', 'of', 'for', 'have', 'with', 'that', 'this', 'was', 'are', 'it', 'can', 'will', 'do', 'would', 'work', 'team', 'experience', 'because', 'like', 'think', 'believe', 'yes', 'no', 'code', 'react', 'node', 'java', 'sql', 'aws', 'about', 'myself'];
        const hasCommonWords = words.some(w => commonWords.includes(w.toLowerCase()));

        // Also check if they just mash random keyboard letters with spaces like "asd adsada a d as d"
        const isMashedKeyboard = /^[asdfghjklqwertyuiopzxcvbnm\s]+$/i.test(userAnswer) && repeatedCharRatio < 0.4 && !hasCommonWords;

        if (isGibberish || isMashedKeyboard || (!hasCommonWords && wordCount < 3 && len >= 10) || len < 5) {
            return {
                reasoning: "Simulated mock reasoning: Answer identified as invalid, random, or gibberish text.",
                score: 0,
                feedback: "Your answer appears to be random or unstructured text. Please provide a meaningful response to the question.",
                category: p.includes("evaluate the candidate") ? "Behavioral" : "Technical"
            };
        } else if (!hasCommonWords && wordCount < 5 && len >= 15) {
            return {
                reasoning: "Simulated mock reasoning: Answer lacks meaningful content.",
                score: 1,
                feedback: "Your answer doesn't seem relevant to the question. Please provide a clear, thoughtful response.",
                category: p.includes("evaluate the candidate") ? "Behavioral" : "Technical"
            };
        }

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

        
        // HR specific scoring (if there's no technical keywords)
        if (p.includes("evaluate the candidate’s answer")) {
             if (len > 180) {
                 score = 9;
                 feedback = "Excellent answer with strong clarity and depth. You clearly articulated your experience.";
             } else if (len > 100) {
                 score = 7;
                 feedback = "Good answer, but could include more specific examples to strengthen your point.";
             } else if (len > 50) {
                 score = 5;
                 feedback = "Average answer. Try to elaborate more clearly on your thought process.";
             } else {
                 score = 3;
                 feedback = "Too brief. Add more explanation and detail to fully answer the question.";
             }
        } else {
            // Technical Scoring
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
        }

        return {
            reasoning: "Simulated mock reasoning since AI API is unavailable.",
            score: score,
            feedback: feedback,
            category: p.includes("evaluate the candidate’s answer") ? "Behavioral" : "Technical"
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
                "How does the virtual DOM work in React?",
                "Can you explain the useEffect hook?",
                "How do you handle routing in React applications?"
            ],
            "node.js": [
                "How does the Event Loop work in Node.js?",
                "What is the purpose of middleware in Express.js?",
                "Explain how streams work in Node.js.",
                "How do you handle errors in Node.js applications?",
                "Explain the concept of EventEmitter."
            ],
            "node": [
                "How does the Event Loop work in Node.js?",
                "What is the purpose of middleware in Express.js?",
                "Explain how streams work in Node.js.",
                "How do you handle errors in Node.js applications?",
                "Explain the concept of EventEmitter."
            ],
            "javascript": [
                "Explain the difference between let, const, and var.",
                "What is a closure in JavaScript?",
                "Can you explain promises and async/await?",
                "What is the difference between == and ===?",
                "Explain event bubbling and event capturing."
            ],
            "java": [
                "What is the difference between an interface and an abstract class?",
                "Explain the concept of multithreading in Java.",
                "How does Garbage Collection work in Java?",
                "What are the different types of memory areas allocated by JVM?",
                "Explain the difference between HashMap and HashTable."
            ],
            "python": [
                "What are decorators in Python and how do you use them?",
                "Can you explain the difference between lists and tuples?",
                "What is the Global Interpreter Lock (GIL) in Python?",
                "How is memory managed in Python?",
                "What are lambda functions in Python?"
            ],
            "sql": [
                "What is the difference between a LEFT JOIN and an INNER JOIN?",
                "Explain what indexing is in a database.",
                "How do you optimize a slow-running SQL query?",
                "What are ACID properties?",
                "Explain the difference between TRUNCATE, DELETE, and DROP."
            ],
            "database": [
                "What is the difference between SQL and NoSQL?",
                "Explain what indexing is in a database.",
                "How do you define ACID properties?",
                "What is database normalization?",
                "What are the advantages of using a NoSQL database?"
            ],
            "aws": [
                "What is the difference between an EC2 instance and a serverless Lambda function?",
                "Can you explain what an S3 bucket is and how to secure it?",
                "How do you use IAM to control AWS resources?",
                "Explain what Amazon VPC is.",
                "How do you manage database deployments in AWS?"
            ]
        };

        let chosenQuestion = "";

        // Find matching topic in our mapping
        const topicKey = Object.keys(specificQuestions).find(key => combinedContext.includes(key));
        let list = [];

        if (topicKey) {
            list = specificQuestions[topicKey];
        } else {
            const displayTopic = extractedTopic || extractedRole || "your area of expertise";
            list = [
                `Can you explain a complex concept related to ${displayTopic}?`,
                `What are the best practices for working with ${displayTopic}?`,
                `Describe a challenging problem you solved using ${displayTopic}.`,
                `If you were designing a scalable architecture for a system involving ${displayTopic}, what key factors would you consider?`,
                `Can you tell me about the most difficult bug you've had to fix in ${displayTopic}?`
            ];
        }

        // Filter out questions that are already in the prompt (previously asked)
        const unaskedQuestions = list.filter(q => !prompt.includes(q));

        if (unaskedQuestions.length > 0) {
            // Pick randomly from unasked questions to avoid prompt length repeats
            chosenQuestion = unaskedQuestions[Math.floor(Math.random() * unaskedQuestions.length)];
        } else {
            // Fallback if we exhausted the list
            chosenQuestion = "Could you elaborate more on your recent technical experience?";
        }

        return {
            message: chosenQuestion,
            feedback: "Moving to next topic.",
            score: 0
        };
    }

    // --- MODE: GENERATE MULTIPLE QUESTIONS (Dashboard) ---
    if (p.includes("generate") && p.includes("distinct") && p.includes("personalized interview questions")) {
        const countMatch = prompt.match(/Generate\s*(\d+)\s*distinct/i);
        const count = countMatch ? parseInt(countMatch[1]) : 5;

        const roleMatch = prompt.match(/Target Role:\s*(.*)/i);
        const role = roleMatch ? roleMatch[1].trim() : "this role";
        
        const topicMatch = prompt.match(/Target Topic\/Skill:\s*(.*)/i);
        const targetFocus = topicMatch ? topicMatch[1].trim() : role;
        
        const targetLower = targetFocus.toLowerCase();
        let questionsList = [];

        if (targetLower.includes("frontend") || targetLower.includes("react") || targetLower.includes("ui")) {
            questionsList = [
                    "Can you explain the difference between the Virtual DOM and the real DOM?",
                    "How do you manage state in a large-scale frontend application?",
                    "Describe a time you had to optimize the performance of a web page.",
                    "What are your favorite CSS features for building responsive layouts?",
                    "How do you handle accessibility (a11y) when building UI components?"
                ];
        } else if (targetLower.includes("backend") || targetLower.includes("node") || targetLower.includes("java")) {
            questionsList = [
                "Explain the concept of asynchronous programming and how it applies to backend services.",
                "How do you secure a REST API against common vulnerabilities?",
                "Describe your experience with database indexing and query optimization.",
                "What strategies do you use for caching backend responses?",
                "Tell me about a time you had to design or scale a microservice architecture."
            ];
        } else if (targetLower.includes("data") || targetLower.includes("machine learning") || targetLower.includes("python")) {
            questionsList = [
                "Can you explain the difference between supervised and unsupervised learning?",
                "How do you handle missing or corrupted data in a dataset?",
                "Describe a machine learning model or data pipeline you built recently.",
                "What metrics do you use to evaluate your queries or models?",
                "How do you optimize data processing workflows for large datasets?"
            ];
        } else if (targetLower.includes("devops") || targetLower.includes("cloud") || targetLower.includes("aws")) {
            questionsList = [
                "How do you implement CI/CD pipelines?",
                "What strategies do you use for zero-downtime deployments?",
                "Describe your experience with Infrastructure as Code.",
                "How do you monitor and handle alerts for production microservices?",
                "Explain how you use Docker and Kubernetes in your daily workflows."
            ];
        } else {
            questionsList = [
                `Can you explain your experience and how it aligns with the ${targetFocus} area?`,
                `Describe a challenging technical problem you solved recently related to this field.`,
                `How do you ensure quality and maintainability in your work?`,
                `Tell me about a time you had to learn a new concept or tool quickly.`,
                `How do you handle technical disagreements within a team?`,
                `What are the most important best practices for ${targetFocus}?`
            ];
        }

        return { questions: questionsList.slice(0, count) };
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
    const modelsToTry = ["gemini-2.0-flash"];

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
    const mockResult = getSmartMockResponse(userPrompt);

    return mockResult;
}

module.exports = { callAI };
