document.addEventListener('DOMContentLoaded', () => {
  // Theme handling
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;

  // Load saved theme
  if (localStorage.getItem('theme') === 'light') {
    body.classList.add('light-mode');
    themeToggle.textContent = '🌞';
  } else {
    body.classList.remove('light-mode');
    themeToggle.textContent = '🌙';
  }

  // Toggle theme
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      body.classList.toggle('light-mode');
      if (body.classList.contains('light-mode')) {
        themeToggle.textContent = '🌞';
        localStorage.setItem('theme', 'light');
      } else {
        themeToggle.textContent = '🌙';
        localStorage.setItem('theme', 'dark');
      }
    });
  }

  // Helper to create slugs
  function createSlug(text) {
    return text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/\./g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  // Parse date helper (YYYY-MM-DD)
  function parseDate(dateStr) {
    return new Date(dateStr);
  }

  // Check if item is recent (within 7 days)
  function isNew(dateStr) {
    const itemDate = parseDate(dateStr);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return itemDate > weekAgo;
  }

  // Main index page
  const latestDiv = document.getElementById('latest-updates');
  const tableBody = document.getElementById('patch-table-body');
  const latestNewsDiv = document.getElementById('latest-news');
  const newsTableBody = document.getElementById('news-table-body');
  const searchInput = document.getElementById('searchInput');

  if (latestDiv && tableBody) {
    // Load and sort patches
    fetch('patches.json')
      .then(res => res.json())
      .then(patches => {
        patches.sort((a, b) => parseDate(b.date) - parseDate(a.date));

        latestDiv.innerHTML = '';
        tableBody.innerHTML = '';

        // Show only the latest patch in "Latest Updates"
        if (patches.length > 0) {
          const latest = patches[0];
          const slug = createSlug(latest.version);
          const badge = isNew(latest.date) ? '<span class="new-badge">NEW</span>' : '';
          const card = document.createElement('div');
          card.className = 'update-card';
          card.innerHTML = `
            <h3>${latest.version} ${badge} - ${latest.date}</h3>
            <p>${latest.keyChanges}</p>
            <a href="patches.html?v=${slug}">Read Full Patch Notes</a>
          `;
          latestDiv.appendChild(card);
        }

        // Full table
        patches.forEach(patch => {
          const slug = createSlug(patch.version);
          const badge = isNew(patch.date) ? '<span class="new-badge">NEW</span>' : '';
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${patch.version} ${badge}</td>
            <td>${patch.date}</td>
            <td>${patch.keyChanges}</td>
            <td><a href="patches.html?v=${slug}">View Full Notes</a></td>
          `;
          tableBody.appendChild(row);
        });
      });

    // Load and sort news
    fetch('news.json')
      .then(res => res.json())
      .then(news => {
        news.sort((a, b) => parseDate(b.date) - parseDate(a.date));

        if (latestNewsDiv) latestNewsDiv.innerHTML = '';
        if (newsTableBody) newsTableBody.innerHTML = '';

        // Show only latest news in card
        if (news.length > 0) {
          const latest = news[0];
          const slug = createSlug(latest.title);
          const badge = isNew(latest.date) ? '<span class="new-badge">NEW</span>' : '';
          const card = document.createElement('div');
          card.className = 'news-card';
          card.innerHTML = `
            <h3>${latest.title} ${badge}</h3>
            <p>${latest.date}</p>
            <p>${latest.summary}</p>
            <a href="news.html?id=${slug}">Read Full News</a>
          `;
          latestNewsDiv.appendChild(card);
        }

        // Full news table
        news.forEach(item => {
          const slug = createSlug(item.title);
          const badge = isNew(item.date) ? '<span class="new-badge">NEW</span>' : '';
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${item.title} ${badge}</td>
            <td>${item.date}</td>
            <td>${item.summary}</td>
            <td><a href="news.html?id=${slug}">Read More</a></td>
          `;
          newsTableBody.appendChild(row);
        });
      });

    // Search
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase();
        document.querySelectorAll('.update-card, .news-card, #patch-table-body tr, #news-table-body tr').forEach(el => {
          const text = el.textContent.toLowerCase();
          el.style.display = text.includes(value) ? '' : 'none';
        });
      });
    }
  }

  // Patch detail page
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
            document.title = `Arc Raiders | ${patch.version}`;
            patchContent.querySelector('h2').textContent = `${patch.version} - ${patch.date}`;
            patchContent.querySelector('.meta').textContent = `Released: ${patch.date}`;
            patchContent.querySelector('.patch-content').innerHTML = patch.fullNotes || '<p>No detailed notes available.</p>';
            patchContent.querySelector('.button').href = patch.link;
          } else {
            patchContent.innerHTML = '<p>Patch not found.</p>';
          }
        });
    }
  }

  // News detail page
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
            document.title = `Arc Raiders News | ${item.title}`;
            newsContent.querySelector('h2').textContent = item.title;
            newsContent.querySelector('.meta').textContent = `Posted: ${item.date}`;
            newsContent.querySelector('.news-content').innerHTML = item.fullContent || '<p>No details available.</p>';
            newsContent.querySelector('.button').href = item.link;
          } else {
            newsContent.innerHTML = '<p>News item not found.</p>';
          }
        });
    }
  }
});
const backToTop = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
  backToTop.classList.toggle('show', window.scrollY > 300);
});
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
