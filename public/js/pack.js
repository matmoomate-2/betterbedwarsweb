/**
 * Better Bedwars - Pack Detail Page Module
 */

const PackPage = (() => {
  let packId = null;

  async function init() {
    // Get pack ID from URL
    const params = new URLSearchParams(window.location.search);
    packId = params.get('id') || 'better-bedwars';

    if (!packId) {
      document.querySelector('main').innerHTML = '<div class="container section"><p>No pack specified.</p></div>';
      return;
    }

    try {
      const [pack, versions] = await Promise.all([
        API.getPack(packId),
        API.getVersions(packId),
      ]);

      if (!pack) {
        document.querySelector('main').innerHTML = '<div class="container section"><h2>Pack not found</h2><p>The requested texture pack could not be found.</p></div>';
        return;
      }

      renderPack(pack, versions);
    } catch (error) {
      console.error('Failed to load pack:', error);
      document.querySelector('main').innerHTML = '<div class="container section"><h2>Error loading pack</h2><p>Please try again later.</p></div>';
    }
  }

  function renderPack(pack, versions) {
    const main = document.querySelector('main');
    const latestVersion = versions && versions.length > 0 ? versions[0] : null;

    // Update page title
    document.title = `${pack.name} - Better Bedwars`;

    // Update meta tags
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = pack.short_description || pack.description;

    main.innerHTML = `
      <!-- Pack Hero -->
      <section class="section" style="padding-bottom: 0;">
        <div class="container">
          <a href="/packs.html" class="btn btn-secondary btn-sm" style="margin-bottom: 20px;">← Back to Packs</a>
          <div style="display: flex; gap: 32px; flex-wrap: wrap; align-items: flex-start;">
            <div style="flex: 1; min-width: 300px;">
              <h1 class="section-title" style="margin-bottom: 16px;">${pack.name}</h1>
              <p style="color: var(--text-secondary); font-size: 1.05rem; line-height: 1.7; margin-bottom: 24px;">
                ${pack.description || 'No description available.'}
              </p>
              <div class="pack-meta" style="margin-bottom: 24px;">
                ${(pack.minecraft_versions || []).map(v => `<span class="tag">MC ${v}</span>`).join(' ')}
                <span class="badge badge-primary">${pack.category || 'Bedwars'}</span>
                <span class="badge badge-secondary">${Utils.formatNumber(pack.download_count || 0)} Downloads</span>
              </div>
              <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                ${latestVersion ? `
                  <a href="${latestVersion.file_url}" class="btn btn-primary btn-lg btn-download" data-version-id="${latestVersion.id}">
                    ⬇ Download v${latestVersion.version} (${Utils.formatFileSize(latestVersion.file_size)})
                  </a>
                ` : ''}
                <a href="#installation" class="btn btn-secondary btn-lg">📖 Installation Guide</a>
              </div>
              ${latestVersion ? `
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 12px;">
                  Compatible with Minecraft ${latestVersion.minecraft_version} • Updated ${Utils.timeAgo(latestVersion.created_at)}
                </p>
              ` : ''}
            </div>
          </div>
        </div>
      </section>

      <!-- Screenshots -->
      <section class="section">
        <div class="container">
          <h2 class="section-title">Screenshots</h2>
          <p class="section-subtitle">See ${pack.name} in action</p>
          <div class="gallery-grid">
            ${[1, 2, 3, 4].map(i => `
              <div class="gallery-item">
                <img src="https://placehold.co/800x450/1c2333/5c6bc0?text=Screenshot+${i}" alt="${pack.name} screenshot ${i}" loading="lazy" />
                <div class="gallery-overlay"><span>View</span></div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- Version History -->
      <section class="section" id="changelog">
        <div class="container">
          <h2 class="section-title">Version History</h2>
          <p class="section-subtitle">All releases of ${pack.name}</p>
          <div class="version-list">
            ${(versions || []).map((v, index) => `
              <div class="version-item ${index === 0 ? 'open' : ''}">
                <div class="version-header">
                  <div class="version-info">
                    <span class="version-number">v${v.version}</span>
                    <div class="version-meta">
                      ${v.is_latest ? '<span class="badge badge-success">Latest</span>' : ''}
                      <span class="tag">MC ${v.minecraft_version}</span>
                      <span class="tag">${Utils.formatFileSize(v.file_size)}</span>
                    </div>
                  </div>
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <span style="color: var(--text-muted); font-size: 0.85rem;">${Utils.formatDate(v.created_at)}</span>
                    <a href="${v.file_url}" class="btn btn-primary btn-sm btn-download" data-version-id="${v.id}">Download</a>
                  </div>
                </div>
                <div class="version-changelog">
                  ${Utils.parseChangelog(v.changelog || 'No changelog available for this version.')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- Installation Guide -->
      <section class="section" id="installation">
        <div class="container">
          <h2 class="section-title">Installation Guide</h2>
          <p class="section-subtitle">How to install ${pack.name}</p>
          <div class="install-steps">
            <div class="install-step">
              <div>
                <h4>Download the Pack</h4>
                <p>Click the download button above to get the latest version of ${pack.name}. The file will be in .zip format.</p>
              </div>
            </div>
            <div class="install-step">
              <div>
                <h4>Open Minecraft</h4>
                <p>Launch Minecraft and navigate to Options → Resource Packs → Open Pack Folder.</p>
              </div>
            </div>
            <div class="install-step">
              <div>
                <h4>Move the File</h4>
                <p>Move the downloaded .zip file into the resourcepacks folder. Do not unzip the file.</p>
              </div>
            </div>
            <div class="install-step">
              <div>
                <h4>Apply the Pack</h4>
                <p>In Minecraft, go to Options → Resource Packs, find ${pack.name} in the list, and move it to the active side.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="section">
        <div class="container">
          <div class="cta-section">
            <h2>Ready to try ${pack.name}?</h2>
            <p>Download now and transform your Bedwars experience.</p>
            <div class="cta-actions">
              ${latestVersion ? `
                <a href="${latestVersion.file_url}" class="btn btn-primary btn-lg btn-download" data-version-id="${latestVersion.id}">
                  ⬇ Download v${latestVersion.version}
                </a>
              ` : ''}
              <a href="/packs.html" class="btn btn-secondary btn-lg">Browse All Packs</a>
            </div>
          </div>
        </div>
      </section>
    `;

    // Setup version toggle
    setupVersionToggle();

    // Setup download tracking
    setupDownloadTracking();
  }

  function setupVersionToggle() {
    document.querySelectorAll('.version-item .version-header').forEach((header) => {
      header.addEventListener('click', (e) => {
        // Don't toggle if clicking a button/link
        if (e.target.closest('.btn, a')) return;
        const item = header.closest('.version-item');
        item.classList.toggle('open');
      });
    });
  }

  function setupDownloadTracking() {
    document.querySelectorAll('.btn-download').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const versionId = btn.dataset.versionId;
        if (versionId && packId) {
          API.trackDownload(packId, versionId);
        }
      });
    });
  }

  return { init };
})();