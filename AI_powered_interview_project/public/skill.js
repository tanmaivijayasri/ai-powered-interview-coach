// Get dashboard data
const data = JSON.parse(localStorage.getItem("dashboardData"));

// Show score
if (data && data.stats) {
  document.getElementById("scoreBox").innerText =
    "Avg Score: " + (data.stats.avgScore || "--") + "/10";
} else {
  document.getElementById("scoreBox").innerText =
    "No dashboard data found.";
}

// Clean lines (IMPORTANT FIX)
function cleanLines(text) {
  return text
    .split("\n")
    .map(line => line.trim())
    .filter(line => line !== "") // remove empty lines FIRST
    .map(line => line.replace(/^-\s*/, "")); // remove "-"
}

// Call backend AI
async function getAISuggestions() {
  try {
    const response = await fetch("/api/analyze-performance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        stats: data.stats,
        resume: data.resume,
        charts: data.charts
      })
    });

    const result = await response.json();
    const text = result.suggestions || "";

    // Split sections
    const skillsRaw = text.split("Courses:")[0];
    const coursesRaw = text.split("Courses:")[1]?.split("Roadmap:")[0] || "";
    const roadmapRaw = text.split("Roadmap:")[1]?.split("Tips:")[0] || "";
    const tipsRaw = text.split("Tips:")[1]?.split("Motivation:")[0] || "";
    const motivationRaw = text.split("Motivation:")[1] || "";

    // Clean + limit
    document.getElementById("skills").innerText =
      cleanLines(skillsRaw.replace("Recommended Skills:", "")).slice(0, 3).join("\n");

    document.getElementById("courses").innerText =
      cleanLines(coursesRaw).slice(0, 2).join("\n");

    document.getElementById("roadmap").innerText =
      cleanLines(roadmapRaw).slice(0, 3).join("\n");

    document.getElementById("tips").innerText =
      cleanLines(tipsRaw).slice(0, 2).join("\n");

    document.getElementById("motivation").innerText =
      cleanLines(motivationRaw).join("\n");

  } catch (error) {
    document.getElementById("skills").innerText = "Error loading";
    document.getElementById("courses").innerText = "Error loading";
    document.getElementById("roadmap").innerText = "Error loading";
    document.getElementById("tips").innerText = "Error loading";
    document.getElementById("motivation").innerText = "Error loading";
  }
}

// Run
if (data) {
  getAISuggestions();
}

// Back
function goBack() {
  window.location.href = "dashboard.html";
}