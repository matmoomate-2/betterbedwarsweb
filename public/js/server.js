/**
 * Better Bedwars - Server Page Module
 */

const ServerPage = (() => {
  async function init() {
    try {
      await loadServerInfo();
      await loadFeatures();
      await loadStaff();
      await loadRules();
    } catch (error) {
      console.error('Server page initialization error:', error);
    }
  }

  async function loadServerInfo() {
    const settings = window._siteSettings;
    if (!settings) return;

    // Server name
    const serverNameEl = document.getElementById('server-name');
    if (serverNameEl) {
      serverNameEl.textContent = settings.server_name || 'Better Bedwars Network';
    }

    // Server IP
    const serverIpEl = document.getElementById('server-ip');
    if (serverIpEl) {
      serverIpEl.textContent = settings.server_ip || 'play.betterbedwars.com';
    }

    // Copy IP button
    const copyBtn = document.getElementById('copy-ip');
    if (copyBtn && settings.server_ip) {
      copyBtn.addEventListener('click', () => {
        Utils.copyToClipboard(settings.server_ip);
      });
    }

    // Discord button
    const discordBtn = document.querySelector('.btn-join-discord');
    if (discordBtn && settings.discord_url) {
      discordBtn.href = settings.discord_url;
    }

    // Fetch live server status
    await fetchServerStatus(settings.server_ip);
  }

  async function fetchServerStatus(serverIp) {
    const statusEl = document.getElementById('server-status');
    const playersEl = document.getElementById('player-count-value');
    const playersMaxEl = document.getElementById('player-max-value');

    if (!serverIp) {
      if (statusEl) {
        statusEl.className = 'server-status offline';
        statusEl.innerHTML = '<span class="status-dot"></span> Server status unavailable';
      }
      return;
    }

    try {
      const status = await API.getServerStatus(serverIp);

      // Update status indicator
      if (statusEl) {
        statusEl.className = `server-status ${status.online ? 'online' : 'offline'}`;
        statusEl.innerHTML = `
          <span class="status-dot"></span>
          ${status.online ? 'Online' : 'Offline'}
        `;
      }

      // Update player count
      if (playersEl) {
        playersEl.textContent = status.players?.online || 0;
      }
      if (playersMaxEl) {
        playersMaxEl.textContent = status.players?.max || 0;
      }
    } catch (error) {
      console.warn('Failed to fetch server status');
      if (statusEl) {
        statusEl.className = 'server-status offline';
        statusEl.innerHTML = '<span class="status-dot"></span> Status unavailable';
      }
    }
  }

  async function loadFeatures() {
    const container = document.getElementById('features-list');
    if (!container) return;

    try {
      const features = await API.getServerFeatures();
      if (features && features.length > 0) {
        container.innerHTML = features
          .map(
            (f) => `
          <div class="feature-item">
            <div class="feature-icon">${getFeatureIcon(f.icon)}</div>
            <div>
              <h4>${f.title}</h4>
              <p>${f.description || ''}</p>
            </div>
          </div>
        `
          )
          .join('');
      }
    } catch (e) {
      console.warn('Failed to load server features');
    }
  }

  function getFeatureIcon(icon) {
    const icons = {
      server: '🖥️',
      shield: '🛡️',
      users: '👥',
      refresh: '🔄',
      star: '⭐',
      lightning: '⚡',
      sword: '⚔️',
      heart: '❤️',
      trophy: '🏆',
      clock: '⏰',
    };
    return icons[icon] || '⭐';
  }

  async function loadStaff() {
    const container = document.getElementById('staff-grid');
    if (!container) return;

    try {
      const staff = await API.getStaff();
      if (staff && staff.length > 0) {
        container.innerHTML = staff
          .map(
            (s) => `
          <div class="card staff-card">
            <div class="staff-avatar">${Utils.generateAvatar(s.name)}</div>
            <div class="staff-name">${s.name}</div>
            <div class="staff-role">${s.role || ''}</div>
            <span class="staff-rank">${s.rank || 'Member'}</span>
          </div>
        `
          )
          .join('');
      } else {
        container.innerHTML = '<p style="color: var(--text-secondary);">Staff list coming soon.</p>';
      }
    } catch (e) {
      console.warn('Failed to load staff');
      container.innerHTML = '<p style="color: var(--text-secondary);">Staff list unavailable.</p>';
    }
  }

  async function loadRules() {
    const container = document.getElementById('rules-list');
    if (!container) return;

    try {
      const rules = await API.getRules();
      if (rules && rules.length > 0) {
        container.innerHTML = rules
          .map(
            (r, i) => `
          <div class="rule-item">
            <div class="rule-number">${i + 1}</div>
            <div>
              <h4>${r.title}</h4>
              <p>${r.description || ''}</p>
            </div>
          </div>
        `
          )
          .join('');
      } else {
        container.innerHTML = '<p style="color: var(--text-secondary);">No rules defined yet.</p>';
      }
    } catch (e) {
      console.warn('Failed to load rules');
      container.innerHTML = '<p style="color: var(--text-secondary);">Rules unavailable.</p>';
    }
  }

  return { init };
})();