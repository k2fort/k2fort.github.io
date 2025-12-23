// script.js
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

    backToTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Highlight animation for event cards (if on events page)
  if (document.getElementById('active-events')) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target.classList.contains('active')) {
          entry.target.style.animation = 'highlight 2s ease-in-out';
          setTimeout(() => entry.target.style.animation = '', 2000);
        }
      });
    }, { threshold: 0.5 });

    // Fetch events logic (advanced version from truncated code)
    async function fetchEvents() {
      const activeContainer = document.getElementById('active-events');
      const upcomingContainer = document.getElementById('upcoming-events');
      const loadingDiv = document.getElementById('loading'); // Assume you add this if needed
      loadingDiv.style.display = 'block';
      eventTimersSection.style.display = 'none';

      try {
        const res = await fetch('events.json');
        const { data: eventsData } = await res.json();

        activeContainer.innerHTML = '';
        upcomingContainer.innerHTML = '';
        const now = new Date().getTime();
        const upcomingList = [];

        eventsData.forEach(event => {
          event.times.forEach(time => {
            const [startH, startM] = time.start.split(':').map(Number);
            const [endH, endM] = time.end.split(':').map(Number);

            let startTime = new Date();
            startTime.setHours(startH, startM, 0, 0);
            let endTime = new Date();
            endTime.setHours(endH, endM, 0, 0);

            const timezoneOffset = startTime.getTimezoneOffset() * 60000;
            const startTimeAdjusted = startTime.getTime() - timezoneOffset;
            const endTimeAdjusted = endTime.getTime() - timezoneOffset;

            const isActive = now >= startTimeAdjusted && now < endTimeAdjusted;
            const remaining = Math.floor((endTimeAdjusted - now) / 60000) + 'm';

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
            } else if (startTimeAdjusted > now) {
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

        loadingDiv.style.display = 'none';
        eventTimersSection.style.display = 'block';
      } catch (err) {
        console.error('Event fetch error:', err);
        loadingDiv.style.display = 'none';
        eventTimersSection.style.display = 'block';
        activeContainer.innerHTML = `<p style="text-align:center;padding:2rem;color:var(--secondary);">⚠️ Error loading events: ${err.message}. Try refreshing.</p>`;
        upcomingContainer.innerHTML = '';
      }
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
