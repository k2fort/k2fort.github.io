document.addEventListener('DOMContentLoaded', () => {
  // Get the elements we need
  const latestDiv = document.getElementById('latest-updates');
  const tableBody = document.getElementById('patch-table-body');

  // Safety check: make sure the HTML elements exist
  if (!latestDiv || !tableBody) {
    console.error('Could not find #latest-updates or #patch-table-body. Check your HTML IDs!');
    if (latestDiv) {
      latestDiv.innerHTML = '<p style="color:red;">Error: Could not find update section. Check HTML.</p>';
    }
    return;
  }

  // Load patches from patches.json
  fetch('patches.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load patches.json - Status: ${response.status}`);
      }
      return response.json();
    })
    .then(patches => {
      // Clear existing content (in case of reload)
      latestDiv.innerHTML = '';
      tableBody.innerHTML = '';

      // Show latest updates (only patches marked as "isLatest": true)
      patches
        .filter(patch => patch.isLatest)
        .forEach(patch => {
          const card = document.createElement('div');
          card.className = 'update-card';
          card.innerHTML = `
            <h3>${patch.version} - ${patch.date}</h3>
            <p>${patch.keyChanges}</p>
            <a href="${patch.link}" target="_blank">Read full notes</a>
          `;
          latestDiv.appendChild(card);
        });

      // Fill the full patch history table
      patches.forEach(patch => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${patch.version}</td>
          <td>${patch.date}</td>
          <td>${patch.keyChanges}</td>
          <td><a href="${patch.link}" target="_blank">View</a></td>
        `;
        tableBody.appendChild(row);
      });

      // Optional: Show a message if no latest updates exist
      if (patches.filter(p => p.isLatest).length === 0) {
        latestDiv.innerHTML = '<p>No latest updates marked yet. Check patches.json.</p>';
      }
    })
    .catch(error => {
      console.error('Error loading patches:', error);
      latestDiv.innerHTML = `
        <p style="color:red; text-align:center;">
          Error loading patch notes: ${error.message}<br>
          Make sure patches.json is in the same folder and has valid JSON.
        </p>
      `;
    });
});
