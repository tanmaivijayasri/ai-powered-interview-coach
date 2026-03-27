const aiService = require('./aiService');
const server_prompt = `
You are an HR interviewer.

Evaluate the candidate’s answer.

Question: What motivates you in your career?
Answer: I am highly motivated by learning new things and applying them to solve challenging problems. This helps me grow.

Evaluation criteria:
- Clarity
- Confidence
- Relevance
- Communication
- Structure

Give:
1. Score out of 10
2. Short constructive feedback (1–2 lines)

Return ONLY JSON:
{
  "score": number,
  "feedback": "text"
}
`;

(async () => {
    // Disable real API to force fallback
    process.env.GEMINI_API_KEY = "invalid";
    const res = await aiService.callAI(server_prompt);
    console.log("Mock Result:", res);
})();
