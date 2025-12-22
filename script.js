document.addEventListener('DOMContentLoaded', () => {
  // Theme handling
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;
  if (localStorage.getItem('theme') === 'light') {
    body.classList.add('light-mode');
    themeToggle.textContent = '🌞';
  } else {
    body.classList.remove('light-mode');
    themeToggle.textContent = '🌙';
  }
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

  // Parse date helper
  function parseDate(dateStr) {
    return new Date(dateStr);
  }

  // Check if item is recent
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
    // Load patches
    fetch('patches.json')
      .then(res => res.json())
      .then(patches => {
        patches.sort((a, b) => parseDate(b.date) - parseDate(a.date));
        latestDiv.innerHTML = '';
        tableBody.innerHTML = '';
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

    // Load news
    fetch('news.json')
      .then(res => res.json())
      .then(news => {
        news.sort((a, b) => parseDate(b.date) - parseDate(a.date));
        if (latestNewsDiv) latestNewsDiv.innerHTML = '';
        if (newsTableBody) newsTableBody.innerHTML = '';
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

  // Load community profiles from GitHub Issues
  if (document.getElementById('profiles-container')) {
    const profilesContainer = document.getElementById('profiles-container');
    const repo = 'k2fort/k2fort.github.io';
    const label = 'profile';

    fetch(`https://api.github.com/repos/${repo}/issues?labels=${label}&state=open`)
      .then(res => res.json())
      .then(issues => {
        profilesContainer.innerHTML = '';
        if (issues.length === 0) {
          profilesContainer.innerHTML = '<p>No player profiles yet. Submit yours above!</p>';
          return;
        }
        issues.forEach(issue => {
          const username = issue.user.login;
          const avatar = issue.user.avatar_url;
          const body = issue.body || '';
          const ignMatch = body.match(/IGN:\s*(.+)/i);
          const discordMatch = body.match(/Discord:\s*(.+)/i);
          const bioMatch = body.match(/Bio:\s*(.+)/i);
          const ign = ignMatch ? ignMatch[1].trim() : 'Not provided';
          const discord = discordMatch ? discordMatch[1].trim() : 'Not provided';
          const bio = bioMatch ? bioMatch[1].trim() : 'No bio provided';
          const card = document.createElement('div');
          card.className = 'profile-card';
          card.innerHTML = `
            <img src="${avatar}" alt="${username}" class="profile-avatar">
            <div class="profile-info">
              <h4>${username}</h4>
              <p><strong>IGN:</strong> ${ign}</p>
              <p><strong>Discord:</strong> ${discord}</p>
              <p>${bio}</p>
              <a href="${issue.html_url}" target="_blank" class="button">View Discussion</a>
            </div>
          `;
          profilesContainer.appendChild(card);
        });
      })
      .catch(err => {
        profilesContainer.innerHTML = '<p>Error loading profiles.</p>';
        console.error('Error:', err);
      });
  }

  // Profile submission form
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const ign = document.getElementById('ign').value.trim();
      const discord = document.getElementById('discord').value.trim();
      const bio = document.getElementById('bio').value.trim();
      const message = document.getElementById('form-message');

      if (!ign || !discord || !bio) {
        message.textContent = 'Please fill all fields.';
        message.style.color = '#ef4444';
        return;
      }

      const issueBody = `IGN: ${ign}\nDiscord: ${discord}\nBio: ${bio}`;
      const issueTitle = `Profile Submission - ${ign}`;
      const repo = 'k2fort/k2fort.github.io';
      const url = `https://github.com/${repo}/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}&labels=profile`;

      window.open(url, '_blank');
      message.textContent = 'Redirecting to GitHub... Submit the issue there to add your profile!';
      message.style.color = '#00d4ff';
      profileForm.reset();
    });
  }

  // Event Timers Page with CORS proxy
  if (document.getElementById('active-events') || document.getElementById('upcoming-events')) {
    const activeContainer = document.getElementById('active-events');
    const upcomingContainer = document.getElementById('upcoming-events');
    const API_URL = 'https://metaforge.app/api/arc-raiders/event-timers';
    const PROXY_URL = 'https://cors-anywhere.herokuapp.com/'; // Free CORS proxy

    function fetchEvents() {
      activeContainer.innerHTML = '<p>Loading events...</p>';
      upcomingContainer.innerHTML = '';

      fetch(PROXY_URL + API_URL)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          activeContainer.innerHTML = '';
          upcomingContainer.innerHTML = '';

          // Active events
          if (data.active && data.active.length > 0) {
            data.active.forEach(event => {
              const card = document.createElement('div');
              card.className = 'event-card active';
              card.innerHTML = `
                <h4>${event.event_type}</h4>
                <p class="status">ACTIVE NOW</p>
                <p class="map">${event.map.toUpperCase()}</p>
                <p class="time">Ends in: ${event.time_remaining}</p>
              `;
              activeContainer.appendChild(card);
            });
          } else {
            activeContainer.innerHTML = '<p>No active events right now.</p>';
          }

          // Upcoming events
          if (data.upcoming && data.upcoming.length > 0) {
            data.upcoming.forEach(event => {
              const card = document.createElement('div');
              card.className = 'event-card';
              card.innerHTML = `
                <h4>${event.event_type}</h4>
                <p class="status">UPCOMING</p>
                <p class="map">${event.map.toUpperCase()}</p>
                <p class="time">Starts in: ${event.time_until_start}</p>
              `;
              upcomingContainer.appendChild(card);
            });
          } else {
            upcomingContainer.innerHTML = '<p>No upcoming events.</p>';
          }
        })
        .catch(err => {
          console.error('Event fetch error:', err);
          activeContainer.innerHTML = `<p>Error loading events: ${err.message}. API may be down or blocked. Try refreshing.</p>`;
          upcomingContainer.innerHTML = '';
        });
    }

    fetchEvents();
    setInterval(fetchEvents, 30000); // Refresh every 30 seconds
  }
});
