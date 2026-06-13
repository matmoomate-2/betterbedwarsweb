/**
 * Better Bedwars - Toast Notification System
 */

const Toast = (() => {
  let container = null;

  /**
   * Initialize the toast container
   */
  function init() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
  }

  /**
   * Show a toast notification
   * @param {string} message - The message to display
   * @param {'success'|'error'|'info'|'warning'} type - Toast type
   * @param {number} duration - Duration in ms before auto-dismiss
   */
  function show(message, type = 'info', duration = 4000) {
    init();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Icon based on type
    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠',
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ'}</span>
      <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    // Auto dismiss
    const timeout = setTimeout(() => {
      dismiss(toast);
    }, duration);

    // Click to dismiss
    toast.addEventListener('click', () => {
      clearTimeout(timeout);
      dismiss(toast);
    });

    return toast;
  }

  /**
   * Dismiss a toast with animation
   */
  function dismiss(toast) {
    if (!toast || !toast.parentNode) return;
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  /**
   * Convenience methods
   */
  function success(message, duration) {
    return show(message, 'success', duration);
  }

  function error(message, duration) {
    return show(message, 'error', duration);
  }

  function info(message, duration) {
    return show(message, 'info', duration);
  }

  function warning(message, duration) {
    return show(message, 'warning', duration);
  }

  return { init, show, dismiss, success, error, info, warning };
})();