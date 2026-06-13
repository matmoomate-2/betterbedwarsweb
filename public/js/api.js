/**
 * Better Bedwars - API Module
 * Handles all data fetching from Supabase and Netlify Functions
 * Uses localStorage as a write-through cache so admin saves work immediately.
 */

const API = (() => {
  // For production, use Netlify snippet injection to set window.SUPABASE_URL and window.SUPABASE_ANON_KEY
  const SUPABASE_URL = window.SUPABASE_URL || 'https://ciyzlhoxwanclkrrsikb.supabase.co';
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpeXpsaG94d2FuY2xrcnJzaWtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDM5NDEsImV4cCI6MjA5NjkxOTk0MX0.lqJaD93lUUEGX2Qp0n5kMKPc5FcotDO_KiwifbpX3TI';
  const FUNCTIONS_BASE = '/.netlify/functions';

  // ============================================================
  // localStorage Cache (settings written by admin panel)
  // ============================================================
  const LS_PREFIX = 'bb_';

  function getCached(key) {
    try {
      const val = localStorage.getItem(LS_PREFIX + key);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  }

  function setCache(key, data) {
    try {
      localStorage.setItem(LS_PREFIX + key, JSON.stringify(data));
    } catch { /* localStorage full or unavailable */ }
  }

  function clearCache() {
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(LS_PREFIX)) localStorage.removeItem(k);
      });
    } catch { /* ignore */ }
  }

  // ============================================================
  // Fallback data (used only when no DB AND no cache exists)
  // ============================================================
  const FALLBACK_SETTINGS = {
    site_name: 'Better Bedwars',
    hero_title: 'Better Bedwars',
    hero_subtitle: 'The Ultimate Bedwars Experience — Enhanced textures, optimized performance, and the competitive edge you need.',
    description: 'A high-quality Minecraft Bedwars texture pack',
    footer_text: '© 2024 Better Bedwars. Not affiliated with Mojang Studios.',
    server_name: 'Better Bedwars Network',
    server_ip: 'play.betterbedwars.com',
    discord_url: '#',
    youtube_url: '#',
    github_url: '#',
    email_contact: 'hello@betterbedwars.com',
    logo_url: '',
    favicon_url: '',
    primary_color: '#5c6bc0',
    secondary_color: '#26c6da',
    accent_color: '#ff7043',
    footer_links: [],
  };

  const FALLBACK_PACKS = [
    {
      id: 'better-bedwars',
      name: 'Better Bedwars',
      description: 'The ultimate Bedwars texture pack designed for clarity, performance, and style.',
      short_description: 'The ultimate Bedwars texture pack',
      category: 'bedwars',
      minecraft_versions: ['1.8.9', '1.19', '1.20', '1.21'],
      download_count: 48723,
      featured: true,
      is_published: true,
      created_at: '2024-06-01T00:00:00Z',
      screenshots: [],
    },
    {
      id: 'lunar-overlay',
      name: 'Lunar Overlay',
      description: 'A clean overlay pack for Lunar Client.',
      short_description: 'Clean overlay for Lunar Client',
      category: 'pvp',
      minecraft_versions: ['1.8.9', '1.19', '1.20'],
      download_count: 12350,
      featured: false,
      is_published: true,
      created_at: '2024-03-15T00:00:00Z',
      screenshots: [],
    },
    {
      id: 'faithful-bedwars',
      name: 'Faithful Bedwars',
      description: 'Classic Faithful for Bedwars.',
      short_description: 'Classic Faithful for Bedwars',
      category: 'bedwars',
      minecraft_versions: ['1.8.9', '1.19', '1.20', '1.21'],
      download_count: 8921,
      featured: false,
      is_published: true,
      created_at: '2024-01-10T00:00:00Z',
      screenshots: [],
    }
  ];

  const FALLBACK_VERSIONS = [
    { id: 'fb-v3', pack_id: 'better-bedwars', version: '3.0.0', changelog: '## What\'s New\n- Redesigned armor textures\n- New sword textures\n- Performance optimizations\n- 1.21 support', file_url: '#', file_size: 15728640, minecraft_version: '1.8.9 - 1.21', is_latest: true, downloads: 15234, created_at: '2024-06-01T00:00:00Z' },
    { id: 'fb-v2', pack_id: 'better-bedwars', version: '2.5.0', changelog: '## Changes\n- Hotbar improvements\n- Bow textures updated\n- Potion visibility fixes', file_url: '#', file_size: 14680064, minecraft_version: '1.8.9 - 1.20', is_latest: false, downloads: 8921, created_at: '2024-03-20T00:00:00Z' },
    { id: 'fb-v1', pack_id: 'better-bedwars', version: '2.0.0', changelog: '## Major Update\n- 64x resolution\n- Animated textures\n- Redesigned UI', file_url: '#', file_size: 12582912, minecraft_version: '1.8.9 - 1.19', is_latest: false, downloads: 24567, created_at: '2024-01-05T00:00:00Z' },
  ];

  const FALLBACK_STAFF = [
    { id: 's1', name: 'Techno', role: 'Owner', rank: 'Admin', sort_order: 1 },
    { id: 's2', name: 'DreamWasTaken', role: 'Developer', rank: 'Admin', sort_order: 2 },
    { id: 's3', name: 'George', role: 'Moderator', rank: 'Mod', sort_order: 3 },
    { id: 's4', name: 'Sapnap', role: 'Moderator', rank: 'Mod', sort_order: 4 },
    { id: 's5', name: 'BadBoyHalo', role: 'Helper', rank: 'Helper', sort_order: 5 },
  ];

  const FALLBACK_RULES = [
    { id: 'r1', title: 'No Cheating', description: 'Hacks or unfair modifications are prohibited.', category: 'General', sort_order: 1 },
    { id: 'r2', title: 'Respect Others', description: 'No harassment, racism, or toxicity.', category: 'General', sort_order: 2 },
    { id: 'r3', title: 'No Griefing', description: 'Do not destroy or steal from others.', category: 'General', sort_order: 3 },
    { id: 'r4', title: 'No Spamming', description: 'Do not spam chat or advertise.', category: 'Chat', sort_order: 4 },
    { id: 'r5', title: 'No Hacked Clients', description: 'Using hacked clients is bannable.', category: 'General', sort_order: 5 },
  ];

  const FALLBACK_FEATURES = [
    { id: 'f1', title: '24/7 Uptime', description: '99.9% uptime guarantee.', icon: 'server', sort_order: 1 },
    { id: 'f2', title: 'Anti-Cheat', description: 'Advanced anti-cheat keeps the game fair.', icon: 'shield', sort_order: 2 },
    { id: 'f3', title: 'Dedicated Staff', description: 'Staff ready to help.', icon: 'users', sort_order: 3 },
    { id: 'f4', title: 'Regular Updates', description: 'New features added regularly.', icon: 'refresh', sort_order: 4 },
    { id: 'f5', title: 'Active Community', description: 'Join our Discord community.', icon: 'discord', sort_order: 5 },
  ];

  /**
   * Generic fetch wrapper
   */
  async function fetchData(url, options = {}) {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return await response.json();
  }

  /**
   * Fetch from Supabase REST API directly (read-only)
   */
  async function supabaseFetch(table, options = {}) {
    const { select = '*', filters = [], order, limit, single = false } = options;
    let url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`;
    filters.forEach((filter) => {
      if (filter.column && filter.value !== undefined) {
        url += `&${filter.column}=${filter.operator || 'eq'}.${encodeURIComponent(String(filter.value))}`;
      }
    });
    if (order) url += `&order=${encodeURIComponent(order.column)}${order.asc ? '.asc' : '.desc'}`;
    if (limit) url += `&limit=${limit}`;
    if (single) url += '&limit=1';
    return fetchData(url, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: 'return=representation' },
    });
  }

  /**
   * Call a Netlify Function
   */
  async function callFunction(functionName, payload = {}) {
    return fetchData(`${FUNCTIONS_BASE}/${functionName}`, { method: 'POST', body: JSON.stringify(payload) });
  }

  // ============================================================
  // Helper: try DB first, then cache, then fallback
  // ============================================================
  async function withFallback(fn, cacheKey, fallback) {
    // 1. Try cache first (fastest, works offline)
    const cached = getCached(cacheKey);
    if (cached) return cached;

    // 2. Try database
    try {
      const result = await fn();
      if (result && (Array.isArray(result) ? result.length > 0 : true)) {
        setCache(cacheKey, result);
        return result;
      }
    } catch (e) {
      console.warn(`${cacheKey} DB unavailable:`, e.message);
    }

    // 3. Use fallback
    return fallback;
  }

  // ============================================================
  // Public API Methods
  // ============================================================

  async function getSiteSettings() {
    return withFallback(
      async () => {
        const r = await supabaseFetch('site_settings', { single: true });
        return r || null;
      },
      'settings',
      FALLBACK_SETTINGS
    );
  }

  async function getPacks(options = {}) {
    return withFallback(
      async () => {
        const filters = [{ column: 'is_published', value: true }];
        if (options.category) filters.push({ column: 'category', value: options.category });
        if (options.featured) filters.push({ column: 'featured', value: true });
        const r = await supabaseFetch('packs', { filters, order: { column: 'download_count', asc: false } });
        return r && r.length > 0 ? r : null;
      },
      'packs',
      FALLBACK_PACKS
    );
  }

  async function getPack(packId) {
    const packs = await getPacks();
    return packs.find(p => p.id === packId) || packs[0];
  }

  async function getVersions(packId) {
    return withFallback(
      async () => {
        const r = await supabaseFetch('versions', {
          filters: [{ column: 'pack_id', value: packId }],
          order: { column: 'created_at', asc: false },
        });
        return r && r.length > 0 ? r : null;
      },
      `versions_${packId}`,
      FALLBACK_VERSIONS
    );
  }

  async function getLatestVersion(packId) {
    const versions = await getVersions(packId);
    return versions.find(v => v.is_latest) || versions[0];
  }

  async function getStaff() {
    return withFallback(
      async () => {
        const r = await supabaseFetch('staff', {
          filters: [{ column: 'is_active', value: true }],
          order: { column: 'sort_order', asc: true },
        });
        return r && r.length > 0 ? r : null;
      },
      'staff',
      FALLBACK_STAFF
    );
  }

  async function getRules() {
    return withFallback(
      async () => {
        const r = await supabaseFetch('rules', { order: { column: 'sort_order', asc: true } });
        return r && r.length > 0 ? r : null;
      },
      'rules',
      FALLBACK_RULES
    );
  }

  async function getServerFeatures() {
    return withFallback(
      async () => {
        const r = await supabaseFetch('server_features', { order: { column: 'sort_order', asc: true } });
        return r && r.length > 0 ? r : null;
      },
      'features',
      FALLBACK_FEATURES
    );
  }

  async function trackDownload(packId, versionId) {
    try { await callFunction('track-download', { packId, versionId }); }
    catch (e) { console.warn('Download tracking failed:', e); }
  }

  async function getTotalDownloads() {
    const packs = await getPacks();
    return packs.reduce((total, pack) => total + (pack.download_count || 0), 0);
  }

  async function getServerStatus(serverIp) {
    if (!serverIp || serverIp === '#') return null;
    try {
      const response = await fetch(`https://api.mcsrvstat.us/2/${serverIp}`);
      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      return {
        online: data.online || false,
        players: { online: data.players?.online || 0, max: data.players?.max || 0 },
        version: data.version || 'Unknown',
        motd: data.motd?.clean?.join(' ') || '',
        icon: data.icon || null,
      };
    } catch (error) {
      return { online: false, players: { online: 0, max: 0 }, error: error.message };
    }
  }

  // ============================================================
  // Methods called by admin panel after successful save
  // ============================================================
  function updateCachedSettings(settings) {
    setCache('settings', settings);
    // Also trigger a page refresh by dispatching event
    window.dispatchEvent(new CustomEvent('settings-updated', { detail: settings }));
  }

  function updateCachedPacks(packs) {
    setCache('packs', packs);
  }

  function updateCachedVersions(packId, versions) {
    setCache(`versions_${packId}`, versions);
  }

  return {
    supabaseFetch, callFunction,
    getSiteSettings, getPacks, getPack, getVersions, getLatestVersion,
    getStaff, getRules, getServerFeatures,
    trackDownload, getTotalDownloads, getServerStatus,
    updateCachedSettings, updateCachedPacks, updateCachedVersions, clearCache,
  };
})();