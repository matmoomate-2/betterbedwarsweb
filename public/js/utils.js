/**
 * Better Bedwars - Utility Module
 * Shared helper functions for the entire site
 */

const Utils = (() => {
  /**
   * Format a number with commas (e.g., 1,234,567)
   */
  function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return Number(num).toLocaleString();
  }

  /**
   * Format file size in human-readable format
   */
  function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return 'Unknown';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Format a date string to a readable format
   */
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Format a relative time string (e.g., "2 days ago")
   */
  function timeAgo(dateString) {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);

    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'week', seconds: 604800 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
      }
    }
    return 'Just now';
  }

  /**
   * Convert markdown-style text to HTML (simple version)
   */
  function markdownToHTML(text) {
    if (!text) return '';
    let html = text;
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Inline code
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    // Headers
    html = html.replace(/^### (.*?)$/gm, '<h4>$1</h4>');
    html = html.replace(/^## (.*?)$/gm, '<h3>$1</h3>');
    // Unordered list items
    html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
    // Wrap consecutive <li> in <ul>
    html = html.replace(/(<li>.*?<\/li>\n?)+/g, '<ul>$&</ul>');
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    return html;
  }

  /**
   * Parse markdown changelog into structured HTML
   */
  function parseChangelog(text) {
    if (!text) return '';
    let html = text;
    // Headers
    html = html.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    // Bold/Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Unordered lists
    html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/((?:<li>.*?<\/li>\n?)+)/g, '<ul>$1</ul>');
    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    // Paragraphs (double line break)
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');
    return html;
  }

  /**
   * Create a DOM element from HTML string
   */
  function createElement(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstChild;
  }

  /**
   * Debounce a function call
   */
  function debounce(func, wait = 300) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * Copy text to clipboard
   */
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      Toast.show('Copied to clipboard!', 'success');
      return true;
    } catch (err) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        Toast.show('Copied to clipboard!', 'success');
        return true;
      } catch (e) {
        Toast.show('Failed to copy', 'error');
        return false;
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }

  /**
   * Lazy load images
   */
  function setupLazyLoading() {
    if ('loading' in HTMLImageElement.prototype) {
      // Browser supports native lazy loading
      document.querySelectorAll('img[data-src]').forEach((img) => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
    } else {
      // Fallback using IntersectionObserver
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach((img) => {
        observer.observe(img);
      });
    }
  }

  /**
   * Get current page name from URL path
   */
  function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    return page.replace('.html', '') || 'index';
  }

  /**
   * Highlight current page in navigation
   */
  function highlightCurrentNav() {
    const page = getCurrentPage();
    document.querySelectorAll('.nav-links a, .mobile-nav a').forEach((link) => {
      const href = link.getAttribute('href');
      if (href) {
        const linkPage = href.replace('.html', '').replace('/', '');
        if (linkPage === page || (page === 'index' && (linkPage === '' || linkPage === 'index'))) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      }
    });
  }

  /**
   * Scroll to an element smoothly
   */
  function scrollToElement(element, offset = 0) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  /**
   * Truncate text to a max length
   */
  function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  /**
   * Generate Minecraft-like avatar from a name (colored letter)
   */
  function generateAvatar(name) {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }

  /**
   * Get Minecraft avatar URL from Crafatar
   */
  function getMinecraftAvatar(uuid, size = 64) {
    if (uuid) {
      return `https://crafatar.com/avatars/${uuid}?size=${size}&overlay`;
    }
    return '';
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Return public methods
  return {
    formatNumber,
    formatFileSize,
    formatDate,
    timeAgo,
    markdownToHTML,
    parseChangelog,
    createElement,
    debounce,
    copyToClipboard,
    setupLazyLoading,
    getCurrentPage,
    highlightCurrentNav,
    scrollToElement,
    truncateText,
    generateAvatar,
    getMinecraftAvatar,
    escapeHTML,
  };
})();