document.addEventListener('DOMContentLoaded', () => {
  const latestDiv = document.getElementById('latest-updates');
  const tableBody = document.getElementById('patch-table-body');

  // Safety check
  if (!latestDiv || !tableBody) {
    console.error('Could not find #latest-updates or #patch-table-body. Check your HTML IDs!');
    return;
  }

  fetch('patches.json')
    .then(response => {
      if (!response.ok) throw new Error('patches.json not found');
      return response.json();
    })
    .then(patches => {
      // Latest updates
      patches.filter(p => p.isLatest).forEach(patch => {
        const card = document.createElement('div');
        card.className = 'update-card';
        card.innerHTML = `
          <h3>${patch.version} - ${patch.date}</h3>
          <p>${patch.keyChanges}</p>
          <a href="${patch.link}" target="_blank">Read full notes</a>
        `;
        latestDiv.appendChild(card);
      }
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase();
        document.querySelectorAll('.update-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(value) ? 'block' : 'none';
  });
}););

      // Table
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
    })
    .catch(error => {
      console.error('Error loading patches:', error);
      latestDiv.innerHTML = '<p style="color:red;">Error loading patch notes. Check console!</p>';
    });
});

