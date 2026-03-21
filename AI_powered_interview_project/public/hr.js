// ================= GLOBAL VARIABLES =================
let questions = [];
let currentIndex = 0;
let totalScore = 0;
let questionLimit = 5;
let allFeedbacks = []; // NEW — stores all Q&A scores silently

// ================= START INTERVIEW =================
async function startHRInterview() {
  const role = document.getElementById("hrRole").value;
  const count = document.getElementById("questionCount").value;

  questionLimit = parseInt(count);

  try {
    const res = await fetch("http://localhost:3000/api/hr/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        role,
        count: questionLimit
      })
    });

    const data = await res.json();

    if (!data.success || !data.questions || data.questions.length === 0) {
      alert("Failed to generate questions");
      return;
    }

    questions = data.questions;
    currentIndex = 0;
    totalScore = 0;

    document.getElementById("startSection").style.display = "none";
    document.getElementById("hrSection").style.display = "block";
    document.getElementById("hrResult").style.display = "none";

    showQuestion();

  } catch (err) {
    console.error(err);
    alert("Server error while generating questions");
  }
}

// ================= SHOW QUESTION =================
// Add this at top with other global variables

function showQuestion() {
  document.getElementById("hrQuestion").innerText =
    `Q${currentIndex + 1} of ${questions.length}: ${questions[currentIndex]}`;

  document.getElementById("hrAnswer").value = "";
  document.getElementById("hrFeedback").innerText = "";
  document.getElementById("nextBtn").style.display = "none";
}

// ================= SUBMIT ANSWER =================
async function submitHRAnswer() {
  const answer = document.getElementById("hrAnswer").value;

  if (!answer) {
    alert("Please write your answer");
    return;
  }

  const question = questions[currentIndex];

  try {
    const res = await fetch("http://localhost:3000/api/hr/evaluate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question,
        answer
      })
    });

    const data = await res.json();

    if (!data.success) {
      alert("Evaluation failed");
      return;
    }

   const score = data.score;
    const feedback = data.feedback;

    totalScore += score;

    // Save feedback silently — don't show yet
    allFeedbacks.push({
      question: questions[currentIndex],
      answer: document.getElementById("hrAnswer").value,
      score,
      feedback
    });

    // Just show a small confirmation, NOT the score
    document.getElementById("hrFeedback").innerText = "✅ Answer saved!";
    document.getElementById("hrFeedback").style.color = "#00FF94";

    document.getElementById("nextBtn").style.display = "block";

  } catch (err) {
    console.error(err);
    alert("Server error while evaluating");
  }
}

// ================= NEXT QUESTION =================
function nextHRQuestion() {
  currentIndex++;

  if (currentIndex >= questions.length) {
    showResult();
    return;
  }

  showQuestion();
}

// ================= SHOW RESULT =================
async function showResult() {
  document.getElementById("hrSection").style.display = "none";
  document.getElementById("hrResult").style.display = "block";

  const avg = (totalScore / questions.length).toFixed(1);
  const avgColor = avg >= 7 ? "#00FF94" : avg >= 5 ? "#FFB800" : "#ff4444";

  // Show average score
  document.getElementById("finalScore").innerHTML =
    `<span style="font-size:2.5rem;font-weight:800;color:${avgColor}">${avg}/10</span><br>
     <span style="color:#888;">Average Score</span>`;

  // Build full breakdown
  let breakdown = `<div style="margin-top:2rem;text-align:left;">
    <h3 style="color:#fff;margin-bottom:1rem;">📋 Question Breakdown</h3>`;

  allFeedbacks.forEach((item, i) => {
    const c = item.score >= 7 ? "#00FF94" : item.score >= 5 ? "#FFB800" : "#ff4444";
    breakdown += `
      <div style="margin-bottom:1rem;padding:1rem;background:#111;border:1px solid #222;border-radius:12px;text-align:left;">
        <p style="color:#888;font-size:0.8rem;">Q${i+1}: ${item.question}</p>
        <p style="color:#ccc;font-size:0.85rem;margin:6px 0;font-style:italic;">"${item.answer}"</p>
        <span style="color:${c};font-weight:700;">Score: ${item.score}/10</span>
        <p style="color:#777;font-size:0.8rem;margin-top:4px;">${item.feedback}</p>
      </div>`;
  });

  breakdown += `</div>`;

  // Inject breakdown after finalScore
  document.getElementById("finalScore").innerHTML += breakdown;

  // ✅ SAVE TO BACKEND
  try {
    await fetch("http://localhost:3000/save-hr-score", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: localStorage.getItem("userEmail"),
        score: avg   // ✅ FIXED
      })
    });
  } catch (err) {
    console.error("Error saving HR score:", err);
  }
}


// ================= RESTART =================
function restartHRInterview() {
  document.getElementById("startSection").style.display = "block";
  document.getElementById("hrSection").style.display = "none";
  document.getElementById("hrResult").style.display = "none";

  questions = [];
  currentIndex = 0;
  totalScore = 0;
  allFeedbacks = []; // Reset feedbacks too
}