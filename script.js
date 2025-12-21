document.addEventListener('DOMContentLoaded', () => {
  // Only run on main page (index.html)
  if (!window.location.pathname.includes('/patches/')) {
    const latestDiv = document.getElementById('latest-updates');
    const tableBody = document.getElementById('patch-table-body');

    if (!latestDiv || !tableBody) {
      console.error('Missing HTML elements on main page!');
      return;
    }

    fetch('patches.json')
      .then(response => {
        if (!response.ok) throw new Error(`patches.json not found - Status: ${response.status}`);
        return response.json();
      })
      .then(patches => {
        latestDiv.innerHTML = '';
        tableBody.innerHTML = '';

        // Generate clean slugs and populate latest updates
        patches.filter(p => p.isLatest).forEach(patch => {
          const slug = patch.version
            .toLowerCase()
            .replace(/\s+/g, '-')      // spaces → hyphen
            .replace(/\./g, '-')       // dots → hyphen
            .replace(/[^a-z0-9-]/g, ''); // remove special chars

          const card = document.createElement('div');
          card.className = 'update-card';
          card.innerHTML = `
            <h3>${patch.version} - ${patch.date}</h3>
            <p>${patch.keyChanges}</p>
            <a href="patches/${slug}.html">Read Full Patch Notes</a>
          `;
          latestDiv.appendChild(card);
        });

        // Populate full patch history table
        patches.forEach(patch => {
          const slug = patch.version
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/\./g, '-')
            .replace(/[^a-z0-9-]/g, '');

          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${patch.version}</td>
            <td>${patch.date}</td>
            <td>${patch.keyChanges}</td>
            <td><a href="patches/${slug}.html">View Full Notes</a></td>
          `;
          tableBody.appendChild(row);
        });

        // Optional: message if no latest updates
        if (patches.filter(p => p.isLatest).length === 0) {
          latestDiv.innerHTML = '<p>No latest updates marked yet.</p>';
        }
      })
      .catch(error => {
        console.error('Error loading patches:', error);
        latestDiv.innerHTML = `
          <p style="color:red; text-align:center;">
            Error loading patch notes: ${error.message}<br>
            Check that patches.json exists and is valid.
          </p>
        `;
      });
  }

  // Handle individual patch detail pages (patches/XXXX.html)
  if (window.location.pathname.includes('/patches/')) {
    const pathParts = window.location.pathname.split('/');
    const filename = pathParts[pathParts.length - 1].replace('.html', '');
    
    // Reconstruct the original version from the slug (e.g., cold-snap-1-7-0 → Cold Snap 1.7.0)
    const versionFromSlug = filename
      .replace(/-/g, ' ')           // hyphens → spaces
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');        // normalize spaces

    fetch('../patches.json')
      .then(res => {
        if (!res.ok) throw new Error('Could not load patches.json');
        return res.json();
      })
      .then(patches => {
        // Find the patch by comparing normalized versions
        const patch = patches.find(p => {
          const normalizedVersion = p.version
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
          return normalizedVersion === versionFromSlug.toLowerCase();
        });

        if (patch) {
          document.title = `Arc Raiders Patch Notes - ${patch.version}`;
          document.querySelector('h2').textContent = `${patch.version} - ${patch.date}`;
          document.querySelector('.meta').textContent = `Released: ${patch.date}`;
          document.querySelector('.patch-content').innerHTML = patch.fullNotes || '<p>No detailed notes available yet.</p>';
          document.querySelector('.button').href = patch.link;
        } else {
          document.querySelector('.patch-content').innerHTML = '<p>Patch not found. Check the URL or patches.json.</p>';
        }
      })
      .catch(err => {
        console.error('Error loading patch details:', err);
        document.querySelector('.patch-content').innerHTML = '<p>Error loading patch details.</p>';
      });
  }
});
