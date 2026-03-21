let selectedFile = null;

function handleSmartFile(files) {
  if (files && files.length > 0) {
    selectedFile = files[0];
    document.getElementById('fileNameDisplay').innerText = `Selected File: ${selectedFile.name}`;
    document.getElementById('analyzeBtn').style.display = 'block';
  }
}

async function analyzeSmartResume() {
  console.log("🚀 analyzeSmartResume triggered");
  if (!selectedFile) return;

  const btn = document.getElementById('analyzeBtn');
  const loading = document.getElementById('smartAnalysisLoading');
  const result = document.getElementById('smartAnalysisResult');

  btn.style.display = 'none';
  loading.style.display = 'block';
  result.style.display = 'none';

  const formData = new FormData();
  formData.append('resume', selectedFile);

  try {
    const res = await fetch("http://localhost:3000/api/resume/analyze-smart", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      },
      body: formData
    });

    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error("Invalid server response");
    }
    loading.style.display = 'none';

    console.log("✅ API RESPONSE:", data);

    if (!res.ok || !data.success) {
      alert("Error: " + (data.error || "Failed to analyze resume"));
      btn.style.display = 'block';
      return;
    }

    const resultSection = document.getElementById("smartAnalysisResult");
    if (resultSection) {
      resultSection.style.display = "block";
      console.log("✅ Result section shown");
    } else {
      console.error("❌ smartAnalysisResult not found in HTML");
    }

    // LEVEL
    const levelEl = document.getElementById("resumeLevel");
    if (levelEl) levelEl.innerText = `Level: ${data.level}`;

    // SCORE
    const scoreEl = document.getElementById("resumeScore");
    if (scoreEl) scoreEl.innerText = data.bestRole?.match || data.score || 0;

    // SUMMARY
    const summaryEl = document.getElementById("resumeSummary");
    if (summaryEl) summaryEl.innerText = data.summary || "Analysis completed";

    // SKILLS
    const skillsBox = document.getElementById("skillsFound");
    if (skillsBox) {
      skillsBox.innerHTML = "";
      (data.skillsFound || []).forEach(skill => {
        const span = document.createElement("span");
        span.innerText = skill;
        span.className = "skill-tag";
        span.style.cssText = "background:#1a1a1a;color:#00ff94;padding:5px 12px;border-radius:20px;margin:4px;display:inline-block;";
        skillsBox.appendChild(span);
      });
    }

    // ROADMAP
    const roadmapBox = document.getElementById("roadmapList");
    if (roadmapBox) {
      roadmapBox.innerHTML = "";
      (data.roadmap || []).forEach(item => {
        const li = document.createElement("li");
        li.innerText = item;
        roadmapBox.appendChild(li);
      });
    }

    // BEST ROLE
    const roleEl = document.getElementById("bestRoleText");
    if (roleEl && data.bestRole) {
      roleEl.innerText = `Best Match: ${data.bestRole.role} (${data.bestRole.match}%)`;
    }

    // Optional multiple roles loop mapping
    const jobMatchesList = document.getElementById('jobMatchesList');
    if (jobMatchesList) {
      jobMatchesList.innerHTML = '';
      if (data.jobMatch && data.jobMatch.length > 0) {
        data.jobMatch.forEach(jm => {
          const div = document.createElement('div');
          div.innerHTML = `<strong>${jm.role}</strong> &rarr; ${jm.match}%`;
          jobMatchesList.appendChild(div);
        });
      }
    }

    let chartCanvas = document.getElementById("jobMatchChart");

    if (!chartCanvas) {
      chartCanvas = document.createElement("canvas");
      chartCanvas.id = "jobMatchChart";
      chartCanvas.style.marginTop = "20px";
      document.getElementById("smartAnalysisResult").appendChild(chartCanvas);
    }

    if (!window.Chart) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/chart.js";
      document.head.appendChild(script);
      await new Promise(resolve => script.onload = resolve);
    }

    if (window.jobMatchChartInstance) {
      window.jobMatchChartInstance.destroy();
    }

    if (data.jobMatch && data.jobMatch.length > 0) {
      const labels = data.jobMatch.map(j => j.role);
      const values = data.jobMatch.map(j => j.match);

      window.jobMatchChartInstance = new Chart(chartCanvas, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [{
            label: "Job Match %",
            data: values,
            backgroundColor: "#00FF94"
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100
            }
          }
        }
      });
    }

    ["resumeLevel","resumeScore","resumeSummary","skillsFound","roadmapList","bestRoleText","smartAnalysisResult"]
      .forEach(id => {
        if (!document.getElementById(id)) {
          console.error("❌ Missing element:", id);
        }
      });
      
    if (document.getElementById("smartAnalysisResult")) {
      document.getElementById("smartAnalysisResult").scrollIntoView({ behavior: "smooth" });
    }
    
  } catch (err) {
    loading.style.display = 'none';
    btn.style.display = 'block';
    alert("Application Error: " + err.message);
  }
}
