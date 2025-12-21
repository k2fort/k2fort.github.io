document.addEventListener('DOMContentLoaded', () => {
  const latestDiv = document.getElementById('latest-updates');
  const tableBody = document.getElementById('patch-table-body');
  const patchContent = document.getElementById('patch-content');

  // Main page (index.html)
  if (latestDiv && tableBody) {
    fetch('patches.json')
      .then(res => {
        if (!res.ok) throw new Error('patches.json not found');
        return res.json();
      })
      .then(patches => {
        latestDiv.innerHTML = '';
        tableBody.innerHTML = '';

        // Latest updates
        patches.filter(p => p.isLatest).forEach(patch => {
          const slug = patch.version.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '-').replace(/[^a-z0-9-]/g, '');
          const card = document.createElement('div');
          card.className = 'update-card';
          card.innerHTML = `
            <h3>${patch.version} - ${patch.date}</h3>
            <p>${patch.keyChanges}</p>
            <a href="patches.html?v=${slug}">Read Full Patch Notes</a>
          `;
          latestDiv.appendChild(card);
        });

        // Full table
        patches.forEach(patch => {
          const slug = patch.version.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '-').replace(/[^a-z0-9-]/g, '');
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${patch.version}</td>
            <td>${patch.date}</td>
            <td>${patch.keyChanges}</td>
            <td><a href="patches.html?v=${slug}">View Full Notes</a></td>
          `;
          tableBody.appendChild(row);
        });
      })
      .catch(err => {
        console.error(err);
        if (latestDiv) latestDiv.innerHTML = '<p style="color:red;">Error loading patches.</p>';
      });
  }

  // Patch detail page (patches.html?v=...)
  if (patchContent) {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('v');

    if (slug) {
      fetch('patches.json')
        .then(res => res.json())
        .then(patches => {
          const patch = patches.find(p => {
            const pSlug = p.version.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '-').replace(/[^a-z0-9-]/g, '');
            return pSlug === slug;
          });

          if (patch) {
            document.title = `Arc Raiders Patch Notes - ${patch.version}`;
            patchContent.querySelector('h2').textContent = `${patch.version} - ${patch.date}`;
            patchContent.querySelector('.meta').textContent = `Released: ${patch.date}`;
            patchContent.querySelector('.patch-content').innerHTML = patch.fullNotes || '<p>No detailed notes yet.</p>';
            patchContent.querySelector('.button').href = patch.link;
          } else {
            patchContent.innerHTML = '<p>Patch not found.</p>';
          }
        })
        .catch(() => {
          patchContent.innerHTML = '<p>Error loading patch details.</p>';
        });
    } else {
      patchContent.innerHTML = '<p>No patch selected. Go back to <a href="index.html">Home</a>.</p>';
    }
  }
});
