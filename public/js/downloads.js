/**
 * Better Bedwars - Downloads Page Module
 */

const DownloadsPage = (() => {
  let allPacks = [];
  let filteredPacks = [];
  let sortOrder = 'popular';

  async function init() {
    try {
      allPacks = await API.getPacks();
      filteredPacks = [...allPacks];
      applySort();
      renderPacks();
      renderTrending();
      setupSearch();
      setupSort();
    } catch (error) {
      console.error('Failed to load downloads:', error);
      const grid = document.querySelector('.packs-grid');
      if (grid) {
        grid.innerHTML = '<p style="color: var(--text-secondary);">Failed to load packs. Please try again later.</p>';
      }
    }
  }

  function applySort() {
    switch (sortOrder) {
      case 'newest':
        filteredPacks.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
      case 'oldest':
        filteredPacks.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
        break;
      case 'popular':
      default:
        filteredPacks.sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
        break;
    }
  }

  function renderPacks() {
    const grid = document.querySelector('.packs-grid');
    const resultCount = document.getElementById('download-count');
    if (!grid) return;

    if (filteredPacks.length === 0) {
      grid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">No packs found.</p>';
      if (resultCount) resultCount.textContent = '0 packs';
      return;
    }

    grid.innerHTML = filteredPacks
      .map(
        (pack) => `
      <div class="card pack-card">
        <div class="pack-meta">
          <span class="badge badge-primary">${pack.category || 'Other'}</span>
          ${(pack.minecraft_versions || []).slice(0, 2).map(v => `<span class="tag">MC ${v}</span>`).join('')}
          ${pack.featured ? '<span class="badge badge-accent">Featured</span>' : ''}
        </div>
        <h3 class="pack-name">${pack.name}</h3>
        <p class="pack-desc">${pack.short_description || (pack.description ? pack.description.substring(0, 120) + '...' : 'No description available.')}</p>
        <div class="pack-footer">
          <span style="color: var(--text-secondary); font-size: 0.85rem;">
            ⬇ ${Utils.formatNumber(pack.download_count || 0)} downloads
          </span>
          <a href="/pack.html?id=${pack.id}" class="btn btn-primary btn-sm">Download</a>
        </div>
      </div>
    `
      )
      .join('');

    if (resultCount) {
      resultCount.textContent = `${filteredPacks.length} pack${filteredPacks.length !== 1 ? 's' : ''}`;
    }
  }

  function renderTrending() {
    const container = document.getElementById('trending-packs');
    if (!container) return;

    // Trending = top downloads
    const trending = [...allPacks]
      .sort((a, b) => (b.download_count || 0) - (a.download_count || 0))
      .slice(0, 3);

    if (trending.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary);">No packs available yet.</p>';
      return;
    }

    container.innerHTML = trending
      .map(
        (pack, i) => `
      <div class="card pack-card" style="position: relative;">
        <div style="position: absolute; top: -8px; left: -8px; width: 32px; height: 32px; background: linear-gradient(135deg, var(--accent), #e64a19); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; color: #fff;">
          ${i + 1}
        </div>
        <h3 class="pack-name" style="margin-top: 8px;">${pack.name}</h3>
        <p class="pack-desc">${Utils.truncateText(pack.short_description || pack.description || 'No description.', 80)}</p>
        <div class="pack-footer">
          <span style="color: var(--text-secondary); font-size: 0.85rem;">⬇ ${Utils.formatNumber(pack.download_count || 0)}</span>
          <a href="/pack.html?id=${pack.id}" class="btn btn-accent btn-sm">Download</a>
        </div>
      </div>
    `
      )
      .join('');
  }

  function setupSearch() {
    const searchInput = document.getElementById('download-search');
    if (!searchInput) return;

    const performSearch = Utils.debounce(() => {
      const query = searchInput.value.toLowerCase().trim();
      filteredPacks = allPacks.filter((pack) => {
        if (!query) return true;
        return (
          pack.name.toLowerCase().includes(query) ||
          pack.description.toLowerCase().includes(query) ||
          pack.short_description?.toLowerCase().includes(query)
        );
      });
      applySort();
      renderPacks();
    }, 300);

    searchInput.addEventListener('input', performSearch);
  }

  function setupSort() {
    const sortSelect = document.getElementById('sort-order');
    if (!sortSelect) return;

    sortSelect.addEventListener('change', () => {
      sortOrder = sortSelect.value;
      applySort();
      renderPacks();
    });
  }

  return { init };
})();