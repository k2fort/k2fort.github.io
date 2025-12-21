document.addEventListener('DOMContentLoaded', () => {
  // Helper function to create clean slugs
  function createSlug(text) {
    return text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/\./g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  // Main page (index.html)
  const latestDiv = document.getElementById('latest-updates');
  const tableBody = document.getElementById('patch-table-body');
  const latestNewsDiv = document.getElementById('latest-news');
  const newsTableBody = document.getElementById('news-table-body');

  if (latestDiv && tableBody) { // We're on index.html
    // Load patches
    fetch('patches.json')
      .then(res => res.json())
      .then(patches => {
        latestDiv.innerHTML = '';
        tableBody.innerHTML = '';

        patches.filter(p => p.isLatest).forEach(patch => {
          const slug = createSlug(patch.version);
          const card = document.createElement('div');
          card.className = 'update-card';
          card.innerHTML = `
            <h3>${patch.version} - ${patch.date}</h3>
            <p>${patch.keyChanges}</p>
            <a href="patches.html?v=${slug}">Read Full Patch Notes</a>
          `;
          latestDiv.appendChild(card);
        });

        patches.forEach(patch => {
          const slug = createSlug(patch.version);
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
      .catch(err => console.error('Patches error:', err));

    // Load news
    fetch('news.json')
      .then(res => res.json())
      .then(news => {
        if (latestNewsDiv) latestNewsDiv.innerHTML = '';
        if (newsTableBody) newsTableBody.innerHTML = '';

        news.filter(n => n.isLatest).forEach(item => {
          const slug = createSlug(item.title);
          const card = document.createElement('div');
          card.className = 'news-card';
          card.innerHTML = `
            <h3>${item.title}</h3>
            <p>${item.date}</p>
            <p>${item.summary}</p>
            <a href="news.html?id=${slug}">Read Full News</a>
          `;
          latestNewsDiv.appendChild(card);
        });

        news.forEach(item => {
          const slug = createSlug(item.title);
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${item.title}</td>
            <td>${item.date}</td>
            <td>${item.summary}</td>
            <td><a href="news.html?id=${slug}">Read More</a></td>
          `;
          newsTableBody.appendChild(row);
        });
      })
      .catch(err => console.error('News error:', err));
  }

  // Patch detail page (patches.html?v=...)
  const patchContent = document.getElementById('patch-content');
  if (patchContent) {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('v');
    if (slug) {
      fetch('patches.json')
        .then(res => res.json())
        .then(patches => {
          const patch = patches.find(p => createSlug(p.version) === slug);
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
        .catch(() => patchContent.innerHTML = '<p>Error loading patch.</p>');
    }
  }

  // News detail page (news.html?id=...)
  const newsContent = document.getElementById('news-content');
  if (newsContent) {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('id');
    if (slug) {
      fetch('news.json')
        .then(res => res.json())
        .then(news => {
          const item = news.find(n => createSlug(n.title) === slug);
          if (item) {
            document.title = `Arc Raiders News - ${item.title}`;
            newsContent.querySelector('h2').textContent = item.title;
            newsContent.querySelector('.meta').textContent = `Posted: ${item.date}`;
            newsContent.querySelector('.news-content').innerHTML = item.fullContent || '<p>No details available.</p>';
            newsContent.querySelector('.button').href = item.link;
          } else {
            newsContent.innerHTML = '<p>News item not found.</p>';
          }
        })
        .catch(() => newsContent.innerHTML = '<p>Error loading news.</p>');
    }
  }
});
