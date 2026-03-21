// unified-resume.js

let unifiedSelectedFile = null;

// Initialize Drag & Drop Handlers inside window.onload or DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('unifiedDropZone');
    if(dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#00FF94';
        dropZone.style.backgroundColor = '#1a1a1a';
      });
      dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#444';
        dropZone.style.backgroundColor = '#111';
      });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#444';
        dropZone.style.backgroundColor = '#111';
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleUnifiedFile(e.dataTransfer.files);
        }
      });
    }
});

function handleUnifiedFile(files) {
  const errorBox = document.getElementById('unifiedErrorBox');
  if(errorBox) errorBox.style.display = 'none';

  if (files && files.length > 0) {
    unifiedSelectedFile = files[0];
    document.getElementById('unifiedFileNameDisplay').innerText = `Selected File: ${unifiedSelectedFile.name}`;
    document.getElementById('unifiedAnalyzeBtn').style.display = 'block';
  }
}

async function analyzeUnifiedResume() {
  if (!unifiedSelectedFile) return;

  const btn = document.getElementById('unifiedAnalyzeBtn');
  const loading = document.getElementById('unifiedAnalysisLoading');
  const result = document.getElementById('unifiedAnalysisResult');
  const errorBox = document.getElementById('unifiedErrorBox');
  const errorText = document.getElementById('unifiedErrorText');

  btn.disabled = true;
  btn.innerText = "Analyzing...";
  loading.style.display = 'block';
  result.style.display = 'none';
  errorBox.style.display = 'none';

  const formData = new FormData();
  formData.append('resume', unifiedSelectedFile);

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

    if (!res.ok || !data.success) {
      errorText.innerText = data.error || "Invalid resume file. Please upload a proper resume.";
      errorBox.style.display = 'block';
      btn.disabled = false;
      btn.innerText = "Analyze Resume";
      return;
    }

    // Populate UI on Success
    document.getElementById('unifiedLevel').innerText = data.level || "Unknown";
    
    if (data.bestRole) {
      document.getElementById('unifiedResumeScore').innerText = data.bestRole.match || 0;
      document.getElementById('unifiedBestMatchLabel').innerText = `Best Match: ${data.bestRole.role} (${data.bestRole.match}%)`;
    } else {
      document.getElementById('unifiedResumeScore').innerText = data.score || 0;
      document.getElementById('unifiedBestMatchLabel').innerText = `Best Match: --`;
    }

    const jobMatchesBox = document.getElementById('unifiedJobMatches');
    if (jobMatchesBox) {
      jobMatchesBox.innerHTML = '';
      if (data.jobMatch && data.jobMatch.length > 0) {
        data.jobMatch.forEach(jm => {
          const div = document.createElement('div');
          div.innerHTML = `<strong>${jm.role}</strong> &rarr; ${jm.match}%`;
          div.style.fontSize = '0.9rem';
          jobMatchesBox.appendChild(div);
        });
      }
    }
    
    // Determine level color dynamically
    let lvlColor = "#00FF94"; // Advanced
    if(data.level === "Intermediate") lvlColor = "#FFB800";
    if(data.level === "Beginner") lvlColor = "#FF4444";
    document.getElementById('unifiedLevel').style.color = lvlColor;
    
    document.getElementById('unifiedSummary').innerText = data.summary || "No summary available.";
    
    const skillsBox = document.getElementById('unifiedSkillsFound');
    skillsBox.innerHTML = '';
    if (data.skillsFound && data.skillsFound.length > 0) {
      data.skillsFound.forEach(s => {
        const span = document.createElement('span');
        span.innerText = s;
        span.style.cssText = 'background: rgba(0, 255, 148, 0.1); color: #00FF94; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; border: 1px solid #00FF94;';
        skillsBox.appendChild(span);
      });
    } else {
      skillsBox.innerHTML = '<span style="color: #666;">None detected</span>';
    }

    const roadmapBox = document.getElementById('unifiedRoadmap');
    roadmapBox.innerHTML = '';
    if (data.roadmap && data.roadmap.length > 0) {
      data.roadmap.forEach(s => {
        const li = document.createElement('li');
        li.innerText = s;
        li.style.marginBottom = '8px';
        roadmapBox.appendChild(li);
      });
    } else {
        roadmapBox.innerHTML = '<li style="color: #666;">Looking good! You are well prepared.</li>';
    }

    result.style.display = 'block';
    
    // re-enable button for new uploads
    btn.disabled = false;
    btn.innerText = "Analyze Resume";
    
  } catch (err) {
    loading.style.display = 'none';
    btn.disabled = false;
    btn.innerText = "Analyze Resume";
    errorText.innerText = "Application Error: " + err.message;
    errorBox.style.display = 'block';
  }
}
