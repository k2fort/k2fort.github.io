document.addEventListener('DOMContentLoaded', () => {
  fetch('patches.json')
    .then(response => response.json())
    .then(patches => {
      // Latest updates section
      const latestDiv = document.getElementById('latest-updates');
      patches.filter(p => p.isLatest).forEach(patch => {
        const card = document.createElement('div');
        card.className = 'update-card';
        card.innerHTML = `
          <h3>${patch.version} - ${patch.date}</h3>
          <p>${patch.keyChanges}</p>
          <a href="${patch.link}" target="_blank">Read full notes</a>
        `;
        latestDiv.appendChild(card);
      });

      // Full patch table
      const tableBody = document.getElementById('patch-table-body');
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
    .catch(error => console.error('Error loading patches:', error));
});