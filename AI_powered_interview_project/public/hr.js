// ================= GLOBAL VARIABLES =================
let questions = [];
let currentIndex = 0;
let totalScore = 0;
let questionLimit = 5;

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
function showQuestion() {
  document.getElementById("hrQuestion").innerText =
    `Q${currentIndex + 1}: ${questions[currentIndex]}`;

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

    document.getElementById("hrFeedback").innerText =
      `Score: ${score}/10 | ${feedback}`;

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

  document.getElementById("finalScore").innerText =
    `Your Average Score: ${avg}/10`;

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
}