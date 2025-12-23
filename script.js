document.addEventListener('DOMContentLoaded', () => {
  // Mobile Navigation Toggle
  const createMobileToggle = () => {
    const logoWrapper = document.querySelector('.logo-wrapper');
    if (logoWrapper && !document.querySelector('.mobile-nav-toggle')) {
      const mobileToggle = document.createElement('button');
      mobileToggle.className = 'mobile-nav-toggle';
      mobileToggle.innerHTML = '☰';
      mobileToggle.setAttribute('aria-label', 'Toggle navigation menu');
      
      logoWrapper.appendChild(mobileToggle);
      
      const navButtons = document.querySelector('.nav-buttons');
      mobileToggle.addEventListener('click', () => {
        navButtons.classList.toggle('active');
        mobileToggle.innerHTML = navButtons.classList.contains('active') ? '✕' : '☰';
      });

      // Close menu when clicking nav links
      document.querySelectorAll('.nav-btn').forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth <= 768) {
            navButtons.classList.remove('active');
            mobileToggle.innerHTML = '☰';
          }
        });
      });

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            !e.target.closest('.nav-buttons') && 
            !e.target.closest('.mobile-nav-toggle')) {
          navButtons.classList.remove('active');
          mobileToggle.innerHTML = '☰';
        }
      });
    }
  };

  createMobileToggle();

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
      const isLight = body.classList.contains('light-mode');
      themeToggle.textContent = isLight ? '🌞' : '🌙';
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
  }

  // Back to top button
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    });

    backToTop.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#' && href.length > 1) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

  // Intersection Observer for fade-in animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, index * 100);
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe cards and sections
  document.querySelectorAll('.update-card, .news-card, .event-card, .profile-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  // Helper functions
  function createSlug(text) {
    return text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/\./g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  function parseDate(dateStr) {
    return new Date(dateStr);
  }

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
          const slug = createSlug(latest.title);
          const badge = isNew(latest.date) ? '<span class="new-badge">NEW</span>' : '';
          const card = document.createElement('div');
          card.className = 'update-card';
          card.innerHTML = `
            <h3>${latest.title} ${badge}</h3>
            <p class="meta">${latest.date}</p>
            <p>${latest.summary}</p>
            <a href="patches.html?v=${slug}">Read Full Patch Notes</a>
          `;
          latestDiv.appendChild(card);
          observer.observe(card);
        }
        
        patches.forEach(patch => {
          const slug = createSlug(patch.title);
          const badge = isNew(patch.date) ? '<span class="new-badge">NEW</span>' : '';
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${patch.title} ${badge}</td>
            <td>${patch.date}</td>
            <td>${patch.summary}</td>
            <td><a href="patches.html?v=${slug}">View Full Notes</a></td>
          `;
          tableBody.appendChild(row);
        });
      })
      .catch(err => console.error('Patches load error:', err));

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
            <p class="meta">${latest.date}</p>
            <p>${latest.summary}</p>
            <a href="news.html?id=${slug}">Read Full News</a>
          `;
          latestNewsDiv.appendChild(card);
          observer.observe(card);
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
      })
      .catch(err => console.error('News load error:', err));

    // Enhanced search with highlighting
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase();
        document.querySelectorAll('.update-card, .news-card, #patch-table-body tr, #news-table-body tr').forEach(el => {
          const text = el.textContent.toLowerCase();
          const matches = text.includes(value);
          el.style.display = matches || value === '' ? '' : 'none';
          if (matches && value !== '') {
            el.style.animation = 'highlight 0.5s ease';
          }
        });
      });
    }
  }

  // Patch detail page with fallback
  const patchContent = document.getElementById('patch-content');
  if (patchContent) {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('v');
    if (slug) {
      fetch('patches.json')
        .then(res => res.json())
        .then(patches => {
          const patch = patches.find(p => createSlug(p.title) === slug);
          if (patch) {
            document.title = `Arc Raiders | ${patch.title}`;
            patchContent.querySelector('h2').textContent = patch.title;
            patchContent.querySelector('.meta').textContent = `Released: ${patch.date}`;
            
            const hasContent = patch.fullContent && patch.fullContent.trim().length > 50;
            
            if (hasContent) {
              patchContent.querySelector('.patch-content').innerHTML = patch.fullContent;
            } else {
              patchContent.querySelector('.patch-content').innerHTML = `
                <div style="padding: 2.5rem; background: linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%); border-radius: 16px; border: 2px solid rgba(0, 212, 255, 0.3);">
                  <p style="margin-bottom: 1rem; font-size: 1.1rem; font-weight: 600;">📄 Full patch notes are available on the official website.</p>
                  <p style="margin-bottom: 1rem; color: var(--text-muted);">${patch.summary}</p>
                  <p style="color: var(--text-muted);">Click the button below to view the complete patch notes on the official Arc Raiders website.</p>
                </div>
              `;
            }
            
            patchContent.querySelector('.button').href = patch.link;
          } else {
            patchContent.innerHTML = '<div style="text-align:center;padding:3rem;"><p>Patch not found.</p><a href="index.html" class="button">Return to Home</a></div>';
          }
        });
    }
  }

  // News detail page with fallback
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
            
            const hasContent = item.fullContent && item.fullContent.trim().length > 50;
            
            if (hasContent) {
              newsContent.querySelector('.news-content').innerHTML = item.fullContent;
            } else {
              newsContent.querySelector('.news-content').innerHTML = `
                <div style="padding: 2.5rem; background: linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%); border-radius: 16px; border: 2px solid rgba(0, 212, 255, 0.3);">
                  <p style="margin-bottom: 1rem; font-size: 1.1rem; font-weight: 600;">📰 Full article is available on the official website.</p>
                  <p style="margin-bottom: 1rem; color: var(--text-muted);">${item.summary}</p>
                  <p style="color: var(--text-muted);">Click the button below to read the complete article on the official Arc Raiders website.</p>
                </div>
              `;
            }
            
            newsContent.querySelector('.button').href = item.link;
          } else {
            newsContent.innerHTML = '<div style="text-align:center;padding:3rem;"><p>News item not found.</p><a href="index.html" class="button">Return to Home</a></div>';
          }
        });
    }
  }

  // Load community profiles from GitHub Issues
  if (document.getElementById('profiles-container')) {
    const profilesContainer = document.getElementById('profiles-container');
    const repo = 'k2fort/k2fort.github.io';
    const label = 'profile';

    profilesContainer.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

    fetch(`https://api.github.com/repos/${repo}/issues?labels=${label}&state=open`)
      .then(res => res.json())
      .then(issues => {
        profilesContainer.innerHTML = '';
        if (issues.length === 0) {
          profilesContainer.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-muted);">No player profiles yet. Be the first to submit yours above! 🚀</p>';
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
            <img src="${avatar}" alt="${username}" class="profile-avatar" loading="lazy">
            <div class="profile-info">
              <h4>${username}</h4>
              <p><strong>IGN:</strong> ${ign}</p>
              <p><strong>Discord:</strong> ${discord}</p>
              <p style="color: var(--text-muted);">${bio}</p>
              <a href="${issue.html_url}" target="_blank" class="button">View Profile</a>
            </div>
          `;
          profilesContainer.appendChild(card);
          observer.observe(card);
        });
      })
      .catch(err => {
        profilesContainer.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--secondary);">Error loading profiles. Please try again later.</p>';
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
        message.textContent = '⚠️ Please fill all fields.';
        message.style.color = 'var(--secondary)';
        return;
      }

      const issueBody = `IGN: ${ign}\nDiscord: ${discord}\nBio: ${bio}`;
      const issueTitle = `Profile Submission - ${ign}`;
      const repo = 'k2fort/k2fort.github.io';
      const url = `https://github.com/${repo}/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}&labels=profile`;

      window.open(url, '_blank');
      message.textContent = '✅ Redirecting to GitHub... Submit the issue there to add your profile!';
      message.style.color = 'var(--success)';
      profileForm.reset();
    });
  }

  // Event Timers Page
  if (document.getElementById('active-events') || document.getElementById('upcoming-events')) {
    const activeContainer = document.getElementById('active-events');
    const upcomingContainer = document.getElementById('upcoming-events');
    const loadingDiv = document.getElementById('loading');
    const eventTimersSection = document.getElementById('event-timers');
    const API_URL = 'https://metaforge.app/api/arc-raiders/event-timers';
    const PROXY_URL = 'https://api.allorigins.win/raw?url=';

    function fetchEvents() {
      fetch(PROXY_URL + encodeURIComponent(API_URL))
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          loadingDiv.style.display = 'none';
          eventTimersSection.style.display = 'block';
          
          activeContainer.innerHTML = '';
          upcomingContainer.innerHTML = '';

          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const currentTime = currentHour * 60 + currentMinute;

          const upcomingList = [];

          data.data.forEach(event => {
            event.times.forEach(time => {
              const startParts = time.start.split(':');
              const endParts = time.end.split(':');
              const startTime = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
              const endTime = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

              const endTimeAdjusted = endTime < startTime ? endTime + 1440 : endTime;
              const startTimeAdjusted = startTime < currentTime ? startTime + 1440 : startTime;

              const isActive = currentTime >= startTime && currentTime <= endTimeAdjusted;

              const remainingMinutes = endTimeAdjusted - currentTime;
              const remaining = isActive ? `${Math.floor(remainingMinutes / 60)}h ${remainingMinutes % 60}m` : '';

              const card = document.createElement('div');
              card.className = 'event-card' + (isActive ? ' active' : '');
              card.innerHTML = `
                <h4>🎯 ${event.name}</h4>
                <p class="status">${isActive ? '🔴 ACTIVE NOW' : '📅 SCHEDULED'}</p>
                <p class="map">🗺️ ${event.map.toUpperCase()}</p>
                <p class="time">⏰ ${time.start} - ${time.end}${isActive ? ` (Ends in ${remaining})` : ''}</p>
              `;

              if (isActive) {
                activeContainer.appendChild(card);
                observer.observe(card);
              } else if (startTimeAdjusted > currentTime) {
                upcomingList.push({ card, startTime: startTimeAdjusted });
              }
            });
          });

          upcomingList.sort((a, b) => a.startTime - b.startTime);
          const limitedUpcoming = upcomingList.slice(0, 9);

          limitedUpcoming.forEach(item => {
            upcomingContainer.appendChild(item.card);
            observer.observe(item.card);
          });

          if (activeContainer.innerHTML === '') {
            activeContainer.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-muted);">No active events right now. Check back soon! ⏳</p>';
          }
          if (upcomingContainer.innerHTML === '') {
            upcomingContainer.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-muted);">No upcoming events scheduled.</p>';
          } else if (upcomingList.length > 9) {
            upcomingContainer.innerHTML += `<p style="text-align:center; color:var(--text-muted); margin-top:1rem;">+ ${upcomingList.length - 9} more upcoming events...</p>`;
          }
        })
        .catch(err => {
          console.error('Event fetch error:', err);
          loadingDiv.style.display = 'none';
          eventTimersSection.style.display = 'block';
          activeContainer.innerHTML = `<p style="text-align:center;padding:2rem;color:var(--secondary);">⚠️ Error loading events: ${err.message}. Try refreshing.</p>`;
          upcomingContainer.innerHTML = '';
        });
    }

    fetchEvents();
    setInterval(fetchEvents, 60000);
  }

  // Add CSS for highlight animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes highlight {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); box-shadow: 0 0 20px rgba(0, 212, 255, 0.3); }
    }
  `;
  document.head.appendChild(style);
});
