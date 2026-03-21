window.addEventListener('DOMContentLoaded', async () => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) return;

    const res = await fetch("http://localhost:3000/api/job-roles", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const rolesData = await res.json();
    
    // Select all single `<select>` elements that need dynamic roles loaded
    const roleSelects = document.querySelectorAll('select#hrRole, select#setRole');
    
    if (rolesData.Categories) {
      roleSelects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '';
        
        for (const [category, roles] of Object.entries(rolesData.Categories)) {
          const optgroup = document.createElement('optgroup');
          optgroup.label = category;
          
          for (const role of Object.keys(roles)) {
            const option = document.createElement('option');
            option.value = role;
            option.textContent = role;
            optgroup.appendChild(option);
          }
          select.appendChild(optgroup);
        }
        
        // Restore previous value if it exists in the new options
        if (currentValue) {
          select.value = currentValue;
        }
      });
    }
  } catch (e) {
    console.error("Failed to load job roles dynamically", e);
  }
});
