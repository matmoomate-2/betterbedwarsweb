/**
 * Better Bedwars - Home Page Module
 */

const HomePage = (() => {
  async function init() {
    try {
      await loadHero();
      await loadFeatures();
      await loadChangelog();
      await loadGallery();
      await loadCTA();
    } catch (error) {
      console.error('Home page initialization error:', error);
    }
  }

  /**
   * Load hero section with dynamic content
   */
  async function loadHero() {
    const settings = window._siteSettings;
    if (!settings) return;

    // Set hero title from settings
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle && settings.hero_title) {
      heroTitle.innerHTML = settings.hero_title.replace(
        /Better Bedwars/g,
        '<span class="gradient-text">Better Bedwars</span>'
      );
    }

    // Set hero subtitle
    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle && settings.hero_subtitle) {
      heroSubtitle.textContent = settings.hero_subtitle;
    }

    // Load total downloads
    try {
      const totalDownloads = await API.getTotalDownloads();
      const downloadStat = document.querySelector('.hero-stat[data-stat="downloads"] .hero-stat-value');
      if (downloadStat) {
        downloadStat.textContent = Utils.formatNumber(totalDownloads);
      }
    } catch (e) {
      console.warn('Failed to load download stats');
    }

    // Load latest version info
    try {
      const latestVersion = await API.getLatestVersion('better-bedwars');
      if (latestVersion) {
        const versionBadge = document.querySelector('.hero-badge');
        if (versionBadge) {
          versionBadge.innerHTML = `⚡ Latest: v${latestVersion.version}`;
        }

        const heroDesc = document.querySelector('.hero-subtitle');
        if (heroDesc && latestVersion.minecraft_version) {
          heroDesc.textContent += ` — Now compatible with Minecraft ${latestVersion.minecraft_version}`;
        }

        // Update download button
        const downloadBtn = document.querySelector('.btn-download-hero');
        if (downloadBtn) {
          downloadBtn.href = latestVersion.file_url;
          downloadBtn.addEventListener('click', (e) => {
            API.trackDownload('better-bedwars', latestVersion.id);
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load latest version');
    }

    // Load featured pack info
    const latestUpdateStat = document.querySelector('.hero-stat[data-stat="updated"] .hero-stat-value');
    if (latestUpdateStat && latestVersion) {
      latestUpdateStat.textContent = `v${latestVersion.version}`;
    }
  }

  /**
   * Load features section
   */
  async function loadFeatures() {
    const featuresGrid = document.querySelector('.features-grid');
    if (!featuresGrid) return;

    const features = [
      {
        icon: '🎨',
        title: 'Crisp Textures',
        desc: 'Hand-crafted 64x textures designed for maximum clarity in intense Bedwars battles.',
      },
      {
        icon: '⚡',
        title: 'Optimized Performance',
        desc: 'Every texture is optimized to maintain high FPS even in the most chaotic fights.',
      },
      {
        icon: '🛡️',
        title: 'Competitive Edge',
        desc: 'Enhanced visibility for swords, armor, and projectiles gives you the advantage.',
      },
      {
        icon: '🎮',
        title: 'Cross-Version Support',
        desc: 'Works seamlessly across Minecraft 1.8.9 through 1.21+ with consistent quality.',
      },
      {
        icon: '🌈',
        title: 'Vibrant Colors',
        desc: 'Carefully balanced color palette that pops without being distracting.',
      },
      {
        icon: '🔄',
        title: 'Regular Updates',
        desc: 'Frequent updates with new features, improvements, and latest version support.',
      },
    ];

    featuresGrid.innerHTML = features
      .map(
        (f) => `
      <div class="card feature-card">
        <div class="feature-icon">${f.icon}</div>
        <h3>${f.title}</h3>
        <p>${f.desc}</p>
      </div>
    `
      )
      .join('');
  }

  /**
   * Load changelog preview
   */
  async function loadChangelog() {
    const container = document.querySelector('.changelog-preview');
    if (!container) return;

    try {
      const versions = await API.getVersions('better-bedwars');
      if (versions && versions.length > 0) {
        const latest = versions[0];
        container.innerHTML = `
          <div class="version-header">
            <h3>📋 Latest Update — v${latest.version}</h3>
            <span class="badge badge-success">Latest</span>
          </div>
          <div class="changelog-content">
            ${Utils.parseChangelog(latest.changelog || 'No changelog available.')}
          </div>
          <div style="margin-top: 16px;">
            <a href="/pack.html?id=better-bedwars" class="btn btn-secondary btn-sm">View Full Changelog →</a>
          </div>
        `;
      }
    } catch (e) {
      container.innerHTML = '<p class="text-secondary">Changelog unavailable.</p>';
    }
  }

  /**
   * Load screenshot gallery
   */
  async function loadGallery() {
    const gallery = document.querySelector('.gallery-grid');
    if (!gallery) return;

    // Use placeholder screenshots (in production, these come from the pack data/settings)
    const screenshots = [
      { src: 'https://placehold.co/800x450/1c2333/5c6bc0?text=In-Game+Screenshot+1', alt: 'In-game screenshot 1' },
      { src: 'https://placehold.co/800x450/1c2333/26c6da?text=In-Game+Screenshot+2', alt: 'In-game screenshot 2' },
      { src: 'https://placehold.co/800x450/1c2333/ff7043?text=In-Game+Screenshot+3', alt: 'In-game screenshot 3' },
      { src: 'https://placehold.co/800x450/1c2333/4caf50?text=In-Game+Screenshot+4', alt: 'In-game screenshot 4' },
    ];

    gallery.innerHTML = screenshots
      .map(
        (s) => `
      <div class="gallery-item">
        <img src="${s.src}" alt="${s.alt}" loading="lazy" />
        <div class="gallery-overlay"><span>View</span></div>
      </div>
    `
      )
      .join('');
  }

  /**
   * Load CTA section with dynamic content
   */
  async function loadCTA() {
    const cta = document.querySelector('.cta-section');
    if (!cta) return;

    const settings = window._siteSettings;
    if (settings) {
      const ctaTitle = cta.querySelector('h2');
      const ctaDesc = cta.querySelector('p');
      if (ctaTitle) ctaTitle.textContent = `Ready to upgrade your ${settings.site_name || 'Bedwars'} experience?`;
      if (ctaDesc) ctaDesc.textContent = 'Join thousands of players who have already made the switch. Download now and see the difference.';
    }

    // Set Discord button
    const discordBtn = cta.querySelector('.btn-discord');
    if (discordBtn && settings?.discord_url) {
      discordBtn.href = settings.discord_url;
    }
  }

  return { init };
})();