// ================= GLOBAL VARIABLES =================
let questions = [];
let currentIndex = 0;
let totalScore = 0;
let questionLimit = 5;
let allFeedbacks = []; // NEW — stores all Q&A scores silently
let cameraStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let isCameraOn = false;
let sessionID = null;
let proctoringInterval = null;
let warningTimeout = null;
let lastPositions = null;
let tabSwitchCount = 0;
let isProctoring = false;
// ================= MIC SETUP =================
let recognition;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    
    // Put speech into textarea
    const answerBox = document.getElementById("hrAnswer");
    answerBox.value += transcript + " ";
  };

  recognition.onerror = function(event) {
    console.error("Speech error:", event.error);
  };
}
// ================= CAMERA TOGGLE =================
async function toggleCamera() {
  const btn = document.getElementById("cameraBtn");

  if (!isCameraOn) {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      isCameraOn = true;
      btn.innerText = "📷 Camera ON (click to disable)";
      btn.style.background = "#00FF94";
      btn.style.color = "#000";

    } catch (err) {
      alert("Camera access denied or not available.");
      console.error(err);
    }
  } else {
    stopCamera();
    btn.innerText = "📷 Enable Camera (Optional)";
    btn.style.background = "#333";
    btn.style.color = "";
  }
}

// ================= START RECORDING =================
function startRecording() {
  if (!cameraStream) return;

  sessionID = crypto.randomUUID();
  recordedChunks = [];

  const preview = document.getElementById("cameraPreview");
  preview.srcObject = cameraStream;
  preview.style.display = "block";

  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";

  mediaRecorder = new MediaRecorder(cameraStream, { mimeType });

  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  mediaRecorder.onstop = async () => {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const formData = new FormData();
    formData.append("video", blob, `${sessionID}.webm`);
    formData.append("sessionID", sessionID);
    formData.append("email", localStorage.getItem("userEmail"));

    try {
      await fetch("http://localhost:3000/save-recording", {
        method: "POST",
        body: formData
      });
      console.log("✅ Recording saved to server");
    } catch (err) {
      console.error("❌ Failed to save recording:", err);
    }
  };

  mediaRecorder.start();
  console.log("🎥 Recording started:", sessionID);
}

// ================= STOP RECORDING =================
function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }

  const preview = document.getElementById("cameraPreview");
  preview.style.display = "none";
  preview.srcObject = null;
}

// ================= STOP CAMERA =================
function stopCamera() {
  stopRecording();

  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }

  isCameraOn = false;
}

// ================= START INTERVIEW =================
// ================= PROCTORING SYSTEM =================

// --- Show Warning ---
function showWarning(message) {
  const banner = document.getElementById("proctoringWarning");
  const text = document.getElementById("warningText");

  text.innerText = message;
  banner.style.display = "block";

  // Clear previous timeout
  if (warningTimeout) clearTimeout(warningTimeout);

  // Auto hide after 4 seconds
  warningTimeout = setTimeout(() => {
    banner.style.display = "none";
  }, 2000);
}

// --- Load Face API Models ---
async function loadFaceModels() {
  const MODEL_URL = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights";
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
    ]);
    console.log("✅ Face models loaded");
    return true;
  } catch (err) {
    console.error("❌ Face model load failed:", err);
    return false;
  }
}

// --- FEATURE 1: Face Detection (No face / Multiple faces / Looking away) ---
async function checkFace() {
  if (!isCameraOn || !cameraStream) return;

  const video = document.getElementById("cameraPreview");
  if (!video || video.readyState < 2) return;

  try {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    // No face detected
    if (detections.length === 0) {
      showWarning("⚠️ No face detected! Please ensure your face is visible.");
      return;
    }

    // Multiple people detected
    if (detections.length > 1) {
      showWarning("⚠️ Multiple people detected! Only one person should be present.");
      return;
    }

    // Looking away detection — check nose position
    const landmarks = detections[0].landmarks;
    const nose = landmarks.getNose()[0];
    const jaw = landmarks.getJawOutline();
    const faceWidth = jaw[16].x - jaw[0].x;
    const faceCenter = jaw[0].x + faceWidth / 2;
    const noseOffset = Math.abs(nose.x - faceCenter);
    const lookAwayThreshold = faceWidth * 0.25;

    if (noseOffset > lookAwayThreshold) {
      showWarning("👀 Please look at the screen! Avoid looking away.");
    }

  } catch (err) {
    console.error("Face check error:", err);
  }
}

// --- FEATURE 2: Unusual Movement Detection ---
async function checkMovement() {
  if (!isCameraOn || !cameraStream) return;

  const video = document.getElementById("cameraPreview");
  if (!video || video.readyState < 2) return;

  try {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());

    if (detections.length === 0) return;

    const box = detections[0].box;
    const currentPos = { x: box.x, y: box.y };

    if (lastPositions) {
      const deltaX = Math.abs(currentPos.x - lastPositions.x);
      const deltaY = Math.abs(currentPos.y - lastPositions.y);

      // If moved more than 60px suddenly = unusual movement
      if (deltaX > 60 || deltaY > 60) {
        showWarning("🚨 Unusual movement detected! Please stay still and focused.");
      }
    }

    lastPositions = currentPos;

  } catch (err) {
    console.error("Movement check error:", err);
  }
}

// --- FEATURE 3: Tab Switch Detection ---
function setupTabSwitchDetection() {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && isProctoring) {
      tabSwitchCount++;
      showWarning(`🚫 Tab switch detected! (${tabSwitchCount} time${tabSwitchCount > 1 ? "s" : ""}). Stay on this page.`);
    }
  });

  window.addEventListener("blur", () => {
    if (isProctoring) {
      showWarning("🚫 You left the interview window! Please stay focused.");
    }
  });
}

// --- START PROCTORING ---
async function startProctoring() {
  if (!isCameraOn) return;

  isProctoring = true;
  lastPositions = null;
  tabSwitchCount = 0;

  // Load face models first
  const modelsLoaded = await loadFaceModels();
  if (!modelsLoaded) {
    console.warn("Proctoring running without face detection");
  }

  // Run face + movement checks every 3 seconds
  // Only start interval if models loaded successfully
  if (modelsLoaded) {
    proctoringInterval = setInterval(async () => {
      await checkFace();
      await checkMovement();
    }, 3000);
  } else {
    console.warn("⚠️ Face detection disabled — models failed to load");
  }

  console.log("✅ Proctoring started");
}

// --- STOP PROCTORING ---
function stopProctoring() {
  isProctoring = false;
  if (proctoringInterval) {
    clearInterval(proctoringInterval);
    proctoringInterval = null;
  }
  if (warningTimeout) {
    clearTimeout(warningTimeout);
    warningTimeout = null;
  }
  const banner = document.getElementById("proctoringWarning");
  if (banner) banner.style.display = "none";

  console.log("🛑 Proctoring stopped");
}
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

    if (isCameraOn) {
      startRecording();
      startProctoring(); // ✅ START PROCTORING
    }

    // Setup tab switch detection always (even without camera)
    setupTabSwitchDetection();
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
        answer,
        email: localStorage.getItem("userEmail")
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

  // STOP RECORDING when interview ends
  // STOP RECORDING + PROCTORING when interview ends
  stopCamera();
  stopProctoring();

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

  // RESET camera button UI (keep camera ON if user had it on)
  const btn = document.getElementById("cameraBtn");
  if (btn) {
    if (isCameraOn) {
      btn.innerText = "📷 Camera ON (click to disable)";
      btn.style.background = "#00FF94";
      btn.style.color = "#000";
    } else {
      btn.innerText = "📷 Enable Camera (Optional)";
      btn.style.background = "#333";
      btn.style.color = "";
    }
  }

  questions = [];
  currentIndex = 0;
  totalScore = 0;
  allFeedbacks = [];
  stopProctoring(); // ✅ STOP PROCTORING on restart
}

// ================= MIC BUTTON =================
document.addEventListener("DOMContentLoaded", () => {
  const micBtn = document.getElementById("micBtn");

  if (micBtn && recognition) {
    let isListening = false;

    micBtn.addEventListener("click", () => {
      if (!isListening) {
        recognition.start();
        isListening = true;
        micBtn.innerText = "🔴 Listening... (click to stop)";
        micBtn.style.background = "#ff4444";
      } else {
        recognition.stop();
        isListening = false;
        micBtn.innerText = "🎤 Speak Answer";
        micBtn.style.background = "";
      }
    });

    recognition.onend = () => {
      isListening = false;
      micBtn.innerText = "🎤 Speak Answer";
      micBtn.style.background = "";
    };
  } else if (micBtn) {
    // Browser doesn't support speech recognition
    micBtn.innerText = "🎤 Not supported in this browser";
    micBtn.disabled = true;
    micBtn.style.opacity = "0.5";
  }
});