/**
 * Better Bedwars - Other Packs Page Module
 */

const PacksPage = (() => {
  let allPacks = [];
  let filteredPacks = [];

  async function init() {
    try {
      allPacks = await API.getPacks();
      filteredPacks = [...allPacks];
      renderPacks();
      setupSearch();
    } catch (error) {
      console.error('Failed to load packs:', error);
      const grid = document.querySelector('.packs-grid');
      if (grid) {
        grid.innerHTML = '<p style="color: var(--text-secondary);">Failed to load packs. Please try again later.</p>';
      }
    }
  }

  function renderPacks() {
    const grid = document.querySelector('.packs-grid');
    const resultCount = document.getElementById('result-count');
    if (!grid) return;

    if (filteredPacks.length === 0) {
      grid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">No packs found matching your search.</p>';
      if (resultCount) resultCount.textContent = '0 results';
      return;
    }

    grid.innerHTML = filteredPacks
      .map(
        (pack) => `
      <div class="card pack-card">
        <div class="pack-meta">
          <span class="badge badge-primary">${pack.category || 'Other'}</span>
          ${(pack.minecraft_versions || []).slice(0, 2).map(v => `<span class="tag">MC ${v}</span>`).join('')}
          ${(pack.minecraft_versions || []).length > 2 ? `<span class="tag">+${pack.minecraft_versions.length - 2}</span>` : ''}
          ${pack.featured ? '<span class="badge badge-accent">Featured</span>' : ''}
        </div>
        <h3 class="pack-name">${pack.name}</h3>
        <p class="pack-desc">${pack.short_description || (pack.description ? pack.description.substring(0, 120) + '...' : 'No description available.')}</p>
        <div class="pack-footer">
          <span style="color: var(--text-secondary); font-size: 0.85rem;">
            ⬇ ${Utils.formatNumber(pack.download_count || 0)}
          </span>
          <a href="/pack.html?id=${pack.id}" class="btn btn-primary btn-sm">View Pack</a>
        </div>
      </div>
    `
      )
      .join('');

    if (resultCount) {
      resultCount.textContent = `${filteredPacks.length} result${filteredPacks.length !== 1 ? 's' : ''}`;
    }
  }

  function setupSearch() {
    const searchInput = document.getElementById('pack-search');
    const filterSelect = document.getElementById('pack-filter');

    const performSearch = Utils.debounce(() => {
      const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
      const category = filterSelect ? filterSelect.value : 'all';

      filteredPacks = allPacks.filter((pack) => {
        // Category filter
        if (category !== 'all' && pack.category !== category) return false;

        // Text search
        if (query) {
          return (
            pack.name.toLowerCase().includes(query) ||
            pack.description.toLowerCase().includes(query) ||
            pack.short_description?.toLowerCase().includes(query)
          );
        }

        return true;
      });

      renderPacks();
    }, 300);

    if (searchInput) {
      searchInput.addEventListener('input', performSearch);
    }

    if (filterSelect) {
      filterSelect.addEventListener('change', performSearch);
    }
  }

  return { init };
})();