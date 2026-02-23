require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");

// Optional Dependencies with Safe Loading
let cors, bcrypt, mongoose, multer;
try { cors = require("cors"); } catch (e) { console.warn("⚠️ cors missing, using default."); }
try { bcrypt = require("bcrypt"); } catch (e) { console.warn("⚠️ bcrypt missing, auth disabled."); }
try { mongoose = require("mongoose"); } catch (e) { console.warn("⚠️ mongoose missing, DB features disabled."); }
try { multer = require("multer"); } catch (e) { console.warn("⚠️ multer missing, file uploads disabled."); }

// Local Modules
const { extractResumeText } = require('./resumeParser');
const aiService = require('./aiService');
const callAI = aiService.callAI ? aiService.callAI : async () => ({ error: "AI Service Unavailable" });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
if (cors) app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Frontend Static Files
app.use(express.static(path.join(__dirname, "public")));

// Uploads Directory
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use("/uploads", express.static(uploadDir));

/* ================= DATABASE ================= */
let User, Resume, InterviewAttempt;

if (mongoose) {
  mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/aiInterviewDB")
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

  // Schemas
  const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: String,
    createdAt: { type: Date, default: Date.now }
  });

  const resumeSchema = new mongoose.Schema({
    userEmail: String,
    extractedText: String,
    analysis: {
      score: Number,
      skills: [String],
      level: String,
      summary: String,
      suggestions: [String],
      questions: [String]
    },
    uploadedAt: { type: Date, default: Date.now }
  });

  // NEW: Granular tracking for every question attempted
  const attemptSchema = new mongoose.Schema({
    userEmail: String,
    question: String,
    userAnswer: String,
    aiFeedback: String,
    score: Number, // 0-10
    category: String, // Technical, Behavioral, System Design
    timestamp: { type: Date, default: Date.now },
    sessionMode: String
  });

  User = mongoose.model("User", userSchema);
  Resume = mongoose.model("Resume", resumeSchema);
  InterviewAttempt = mongoose.model("InterviewAttempt", attemptSchema);
}

/* ================= ROUTES ================= */

// Auth Routes
if (User && bcrypt) {
  app.post("/register", async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
      if (await User.findOne({ email })) return res.status(409).json({ message: "User exists" });
      const hashedPassword = await bcrypt.hash(password, 10);
      await new User({ name, email, password: hashedPassword, role }).save();
      res.status(201).json({ success: true });
    } catch (e) { res.status(500).json({ message: "Error registering user" }); }
  });

  app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (user && await bcrypt.compare(password, user.password)) res.json({ success: true });
      else res.status(401).json({ success: false, message: "Invalid credentials" });
    } catch (e) { res.status(500).json({ message: "Login error" }); }
  });
} else {
  app.post("/register", (req, res) => res.status(503).json({ message: "DB unavailable" }));
  app.post("/login", (req, res) => res.status(503).json({ message: "DB unavailable" }));
}

/* --- RESUME UPLOAD --- */
if (multer) {
  const upload = multer({ dest: "uploads/", limits: { fileSize: 10 * 1024 * 1024 } });

  app.post("/upload-resume", upload.single("resume"), async (req, res) => {
    try {
      const { email } = req.body;
      const file = req.file;
      if (!file) return res.status(400).json({ message: "No file uploaded." });

      const text = await extractResumeText(file.path, file.mimetype);
      if (!text || text.length < 50) return res.status(400).json({ message: "Resume text too short." });

      const prompt = `
      Perform a deep analysis of this resume.
      Task:
      1. Extract a concise executive summary (3-4 sentences max).
      2. Identify the candidate's experience level (Entry, Mid, Senior, Lead).
      3. List exactly 5-8 key technical skills (e.g., Python, React, AWS).
      4. Suggest 3 specific interview questions related to their projects or skills.
      5. Calculate a match score (0-100) for a general Software Engineer role.

      RESUME CONTENT:
      ${text.substring(0, 4000)}

      Return JSON strictly:
      {
        "summary": "string",
        "level": "string",
        "skills": ["string", "string"],
        "questions": ["string", "string"],
        "score": number, 
        "suggestions": ["string", "string"]
      }`;

      const analysisRaw = await callAI(prompt, "System: Expert Technical Recruiter");

      // Ensure strict structure and defaults
      const analysis = {
        score: analysisRaw.score || 0,
        skills: Array.isArray(analysisRaw.skills) ? analysisRaw.skills : [],
        level: analysisRaw.level || "Unknown",
        summary: analysisRaw.summary || "Candidate profile analysis unavailable.",
        suggestions: Array.isArray(analysisRaw.suggestions) ? analysisRaw.suggestions : [],
        questions: Array.isArray(analysisRaw.questions) ? analysisRaw.questions : []
      };

      if (Resume && email) {
        await Resume.findOneAndUpdate(
          { userEmail: email },
          {
            extractedText: text,
            analysis: analysis
          },
          { upsert: true }
        );
      }

      res.json({ success: true, analysis });
    } catch (error) {
      console.error("❌ Resume Upload Error:", error.message);
      res.status(400).json({ success: false, message: error.message || "Upload failed. Please ensure the file is valid." });
    }
  });
}

/* --- DYNAMIC DASHBOARD ANALYTICS --- */
app.get("/user-dashboard/:email", async (req, res) => {
  try {
    const { email } = req.params;

    // 1. Resume Data
    const resumeDoc = Resume ? await Resume.findOne({ userEmail: email }) : null;

    // 2. Interview Performance Data
    // Get all attempts for this user
    const attempts = InterviewAttempt ? await InterviewAttempt.find({ userEmail: email }).sort({ timestamp: 1 }) : [];

    // --- Metrics Config ---
    const totalQuestions = attempts.length;

    // Avg Score
    const totalScore = attempts.reduce((sum, a) => sum + (a.score || 0), 0);
    const avgScore = totalQuestions > 0 ? (totalScore / totalQuestions).toFixed(1) : 0;

    // Practice Time (Estimate: 2 mins per question)
    const practiceMins = totalQuestions * 2;
    const practiceTime = practiceMins > 60 ? `${(practiceMins / 60).toFixed(1)}h` : `${practiceMins}m`;

    // --- Charts Logic ---

    // 1. Skill Distribution (Donut Chart)
    const skillCounts = { Technical: 0, Behavioral: 0, SystemDesign: 0 };
    attempts.forEach(a => {
      // Simple fuzzy match or fallback
      const cat = a.category || "Technical";
      if (cat.match(/Behavioral/i)) skillCounts.Behavioral++;
      else if (cat.match(/System/i)) skillCounts.SystemDesign++;
      else skillCounts.Technical++;
    });

    // 2. Performance Trend (Line Chart - Last 7 entries or days)
    // We'll group by "Session" (just take the last 10 attempts for simplicity in this demo)
    const recentAttempts = attempts.slice(-10);
    const trendLabels = recentAttempts.map(a => new Date(a.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    const trendData = recentAttempts.map(a => a.score);

    res.json({
      resume: resumeDoc ? resumeDoc.analysis : null,
      stats: {
        totalQuestions,
        avgScore,
        practiceTime
      },
      charts: {
        skills: [skillCounts.Technical, skillCounts.Behavioral, skillCounts.SystemDesign],
        trendLabels,
        trendData
      }
    });

  } catch (e) {
    console.error("Dashboard Error:", e);
    res.status(500).json({ message: "Server Error" });
  }
});

/* --- INTERVIEW CHAT (Saving Attempts) --- */
app.post("/interview/chat", async (req, res) => {
  const { email, message, context, isFirst } = req.body;

  try {
    let resumeData = null;
    if (context.mode === 'resume' && Resume) {
      const resume = await Resume.findOne({ userEmail: email });
      resumeData = resume ? resume.analysis : null;
    }

    // 1. Evaluate User Answer
    let evaluation = null;
    if (!isFirst) {
      // Strict JSON prompt for evaluation
      const evalPrompt = `
          Evaluate this answer. 
          User Answer: "${message}"
          Context: ${context.mode} interview. Topic: ${context.skill || 'General'}.
          
          Return JSON strictly:
          {
            "score": number (0-10),
            "feedback": "string (concise)",
            "category": "Technical" | "Behavioral" | "System Design"
          }
        `;

      evaluation = await callAI(evalPrompt);

      // SAVE ATTEMPT
      if (evaluation && InterviewAttempt) {
        await new InterviewAttempt({
          userEmail: email,
          question: "Interview Question", // In a real app, pass the Q ID. Here we log generic.
          userAnswer: message,
          aiFeedback: evaluation.feedback,
          score: evaluation.score,
          category: evaluation.category || "Technical",
          sessionMode: context.mode
        }).save();
      }
    }

    // 2. Generate Next Question
    let contextData = "";
    if (context.mode === 'resume' && resumeData) {
      contextData = `
        Candidate Resume Analysis:
        - Level: ${resumeData.level}
        - Detected Skills: ${resumeData.skills.join(", ")}
        - Summary: ${resumeData.summary || "N/A"}
        
        Task: Ask a relevant technical or behavioral interview question tailored to this candidate's profile.
        `;
    } else {
      contextData = `Topic: ${context.skill || 'General Software Engineering'}`;
    }

    const nextQPrompt = `
        Generate the next interview question.
        Context: ${contextData}
        Previous Interaction:
        - User's Last Answer: "${message}"
        - AI Feedback: ${JSON.stringify(evaluation)}
        
        Constraint: Keep the question concise and professional.
        Return JSON strictly: { "message": "string" }
    `;
    const nextQ = await callAI(nextQPrompt);

    res.json({
      reply: nextQ.message,
      evaluation
    });

  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ message: "Chat Logic Failed" });
  }
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
