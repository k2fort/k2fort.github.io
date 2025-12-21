document.addEventListener('DOMContentLoaded', () => {
  const latestDiv = document.getElementById('latest-updates');
  const tableBody = document.getElementById('patch-table-body');

  if (!latestDiv || !tableBody) {
    console.error('Missing HTML elements!');
    return;
  }

  fetch('patches.json')
    .then(response => {
      if (!response.ok) throw new Error('patches.json not found');
      return response.json();
    })
    .then(patches => {
      latestDiv.innerHTML = '';
      tableBody.innerHTML = '';

      // Latest updates
      patches.filter(p => p.isLatest).forEach(patch => {
        const card = document.createElement('div');
        card.className = 'update-card';
        card.innerHTML = `
          <h3>${patch.version} - ${patch.date}</h3>
          <p>${patch.keyChanges}</p>
          <a href="patches/${patch.version.replace(/\./g, '-')}.html" target="_blank">Read Full Patch Notes</a>
        `;
        latestDiv.appendChild(card);
      });

      // Full table with links to individual pages
patches.forEach(patch => {
  // Clean slug: lowercase, replace spaces and dots with hyphens, remove extra spaces
  const slug = patch.version
    .toLowerCase()
    .replace(/\s+/g, '-')        // spaces → hyphen
    .replace(/\./g, '-')         // dots → hyphen
    .replace(/[^a-z0-9-]/g, ''); // remove any other special chars

  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${patch.version}</td>
    <td>${patch.date}</td>
    <td>${patch.keyChanges}</td>
    <td><a href="patches/${slug}.html">View Full Notes</a></td>
  `;
  tableBody.appendChild(row);
});
    })
    .catch(error => {
      console.error('Error:', error);
      latestDiv.innerHTML = `<p style="color:red;">Error loading patches: ${error.message}</p>`;
    });

  // Automatically generate individual patch pages if they don't exist
  if (window.location.pathname.includes('/patches/')) {
    const version = window.location.pathname.split('/').pop().replace('.html', '').replace(/-/g, '.');
    fetch('../patches.json')
      .then(res => res.json())
      .then(patches => {
        const patch = patches.find(p => p.version === version);
        if (patch) {
          document.title = `Arc Raiders Patch Notes - ${patch.version}`;
          document.querySelector('h2').textContent = `${patch.version} - ${patch.date}`;
          document.querySelector('.meta').textContent = `Released: ${patch.date}`;
          document.querySelector('.patch-content').innerHTML = patch.fullNotes || '<p>No detailed notes yet.</p>';
          document.querySelector('.button').href = patch.link;
        } else {
          document.querySelector('.patch-content').innerHTML = '<p>Patch not found.</p>';
        }
      });
  }
});

