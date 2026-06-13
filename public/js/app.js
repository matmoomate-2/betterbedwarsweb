/**
 * Better Bedwars - Main Application
 * Handles navigation, theme, announcement, footer, and page initialization
 */

const App = (() => {
  // Site settings cache
  let settings = null;

  /**
   * Initialize the application
   */
  async function init() {
    try {
      // Load site settings
      settings = await API.getSiteSettings();
      applySettings(settings);
    } catch (error) {
      console.warn('Failed to load site settings, using defaults:', error);
    }

    // Initialize components
    setupNavigation();
    setupThemeToggle();
    setupAnnouncement();
    setupFooter();
    setupLightbox();
    setupSmoothScroll();

    // Highlight current page in nav
    Utils.highlightCurrentNav();

    // Initialize page-specific functionality
    initPage();
  }

  /**
   * Apply site settings to the DOM
   */
  function applySettings(s) {
    if (!s) return;

    // Site name
    document.title = s.site_name || 'Better Bedwars';

    // Brand name
    document.querySelectorAll('.nav-brand-text').forEach((el) => {
      el.textContent = s.site_name || 'Better Bedwars';
    });

    // Announcement bar
    const annBar = document.getElementById('announcement-bar');
    const annText = document.getElementById('announcement-text');
    if (annBar && annText) {
      if (s.announcement_enabled && s.announcement_text) {
        annText.textContent = s.announcement_text;
        annBar.classList.add('visible');
        annBar.className = `announcement-bar visible announcement-${s.announcement_type || 'info'}`;
      }
    }

    // Dynamic favicon / theme color could be set here

    // Store settings globally for other modules
    window._siteSettings = s;
  }

  /**
   * Setup sticky navigation and mobile menu
   */
  function setupNavigation() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');
    const mobileOverlay = document.querySelector('.mobile-overlay');
    const mobileNavClose = document.querySelector('.mobile-nav-close');

    if (mobileMenuBtn && mobileNav) {
      const openMenu = () => {
        mobileNav.classList.add('open');
        if (mobileOverlay) mobileOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
      };

      const closeMenu = () => {
        mobileNav.classList.remove('open');
        if (mobileOverlay) mobileOverlay.classList.remove('open');
        document.body.style.overflow = '';
      };

      mobileMenuBtn.addEventListener('click', openMenu);

      if (mobileNavClose) {
        mobileNavClose.addEventListener('click', closeMenu);
      }

      if (mobileOverlay) {
        mobileOverlay.addEventListener('click', closeMenu);
      }

      // Close mobile nav when a link is clicked
      mobileNav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', closeMenu);
      });

      // Close on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMenu();
      });
    }

    // Sticky navbar shadow on scroll
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
          navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.3)';
        } else {
          navbar.style.boxShadow = 'none';
        }
      });
    }
  }

  /**
   * Setup dark/light theme toggle
   */
  function setupThemeToggle() {
    const toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('bb-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // Default to dark (our site theme)
    const isDark = savedTheme ? savedTheme === 'dark' : true;

    // Apply initial theme
    applyTheme(isDark);

    toggle.addEventListener('click', () => {
      const root = document.documentElement;
      const hasTheme = root.getAttribute('data-theme') === 'light';
      const newIsDark = hasTheme; // if currently light, go dark; if dark (no attr), go light
      applyTheme(newIsDark);
      localStorage.setItem('bb-theme', newIsDark ? 'dark' : 'light');
    });
  }

  /**
   * Apply theme to document
   */
  function applyTheme(isDark) {
    const root = document.documentElement;
    const toggle = document.querySelector('.theme-toggle');

    if (isDark) {
      root.removeAttribute('data-theme');
      if (toggle) toggle.textContent = '☀️';
    } else {
      root.setAttribute('data-theme', 'light');
      if (toggle) toggle.textContent = '🌙';
    }
  }

  /**
   * Setup announcement bar dismiss
   */
  function setupAnnouncement() {
    const closeBtn = document.querySelector('.close-announcement');
    const annBar = document.getElementById('announcement-bar');

    if (closeBtn && annBar) {
      closeBtn.addEventListener('click', () => {
        annBar.classList.remove('visible');
        // Remember dismissal for session
        sessionStorage.setItem('bb-announcement-dismissed', 'true');
      });

      // Check if already dismissed this session
      if (sessionStorage.getItem('bb-announcement-dismissed')) {
        annBar.classList.remove('visible');
      }
    }
  }

  /**
   * Setup footer with dynamic links from site settings
   */
  function setupFooter() {
    if (!settings) return;

    // Set footer text
    const footerText = document.getElementById('footer-text');
    if (footerText && settings.footer_text) {
      footerText.textContent = settings.footer_text;
    }

    // Set social links
    if (settings.discord_url) {
      const el = document.querySelector('.footer-social a[aria-label="Discord"]');
      if (el) el.href = settings.discord_url;
    }
    if (settings.youtube_url) {
      const el = document.querySelector('.footer-social a[aria-label="YouTube"]');
      if (el) el.href = settings.youtube_url;
    }
    if (settings.github_url) {
      const el = document.querySelector('.footer-social a[aria-label="GitHub"]');
      if (el) el.href = settings.github_url;
    }

    // Dynamic footer links from settings
    const footerLinksContainer = document.getElementById('footer-links');
    if (footerLinksContainer && settings.footer_links) {
      try {
        const links = typeof settings.footer_links === 'string'
          ? JSON.parse(settings.footer_links)
          : settings.footer_links;
        if (Array.isArray(links) && links.length > 0) {
          footerLinksContainer.innerHTML = links
            .map(
              (link) =>
                `<a href="${Utils.escapeHTML(link.url || '#')}">${Utils.escapeHTML(link.label || 'Link')}</a>`
            )
            .join('');
        }
      } catch (e) {
        console.warn('Failed to parse footer links');
      }
    }
  }

  /**
   * Setup lightbox for gallery images
   */
  function setupLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    const lightboxImg = lightbox.querySelector('img');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');

    let currentIndex = 0;
    let images = [];

    // Delegate click events for gallery items
    document.addEventListener('click', (e) => {
      const galleryItem = e.target.closest('.gallery-item');
      if (!galleryItem) return;

      const gallery = galleryItem.closest('.gallery-grid');
      if (gallery) {
        images = Array.from(gallery.querySelectorAll('.gallery-item img'));
        currentIndex = images.indexOf(galleryItem.querySelector('img'));
        openLightbox(currentIndex);
      }
    });

    function openLightbox(index) {
      if (images.length === 0) return;
      currentIndex = index;
      const img = images[currentIndex];
      lightboxImg.src = img.src || img.dataset.src;
      lightboxImg.alt = img.alt || 'Screenshot';
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
      updateNavButtons();
    }

    function updateNavButtons() {
      if (prevBtn) prevBtn.style.display = images.length > 1 ? 'flex' : 'none';
      if (nextBtn) nextBtn.style.display = images.length > 1 ? 'flex' : 'none';
    }

    function navigate(direction) {
      currentIndex += direction;
      if (currentIndex < 0) currentIndex = images.length - 1;
      if (currentIndex >= images.length) currentIndex = 0;
      const img = images[currentIndex];
      lightboxImg.src = img.src || img.dataset.src;
      lightboxImg.alt = img.alt || 'Screenshot';
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', closeLightbox);
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => navigate(-1));
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => navigate(1));
    }

    // Close on overlay click
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
    });

    function closeLightbox() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
      lightboxImg.src = '';
    }
  }

  /**
   * Setup smooth scroll for anchor links
   */
  function setupSmoothScroll() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        Utils.scrollToElement(target, 80);
      }
    });
  }

  /**
   * Initialize page-specific functionality
   */
  function initPage() {
    const page = Utils.getCurrentPage();

    switch (page) {
      case 'index':
        if (typeof HomePage !== 'undefined') HomePage.init();
        break;
      case 'pack':
        if (typeof PackPage !== 'undefined') PackPage.init();
        break;
      case 'packs':
        if (typeof PacksPage !== 'undefined') PacksPage.init();
        break;
      case 'server':
        if (typeof ServerPage !== 'undefined') ServerPage.init();
        break;
      case 'downloads':
        if (typeof DownloadsPage !== 'undefined') DownloadsPage.init();
        break;
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Return public API if needed externally
  return { init, applySettings };
})();