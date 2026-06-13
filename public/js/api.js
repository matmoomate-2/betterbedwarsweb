/**
 * Better Bedwars - API Module
 * Handles all data fetching from Supabase and Netlify Functions
 */

const API = (() => {
  // Use environment variable or default to local dev
  const SUPABASE_URL = window.SUPABASE_URL || 'https://your-project.supabase.co';
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'your-anon-key';
  const FUNCTIONS_BASE = '/.netlify/functions';

  /**
   * Generic fetch wrapper with error handling
   */
  async function fetchData(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${url}]:`, error);
      throw error;
    }
  }

  /**
   * Fetch from Supabase REST API directly (read-only)
   */
  async function supabaseFetch(table, options = {}) {
    const { select = '*', filters = [], order, limit, single = false } = options;

    let url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`;

    // Build filter query
    filters.forEach((filter) => {
      if (filter.column && filter.value !== undefined) {
        const operator = filter.operator || 'eq';
        url += `&${filter.column}=${operator}.${encodeURIComponent(filter.value)}`;
      }
    });

    // Ordering
    if (order) {
      url += `&order=${encodeURIComponent(order.column)}${order.asc ? '.asc' : '.desc'}`;
    }

    // Limit
    if (limit) {
      url += `&limit=${limit}`;
    }

    // Single row
    if (single) {
      url += '&limit=1';
    }

    const result = await fetchData(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'return=representation',
      },
    });

    return single ? (result[0] || null) : result;
  }

  /**
   * Call a Netlify Function (for write operations)
   */
  async function callFunction(functionName, payload = {}) {
    return fetchData(`${FUNCTIONS_BASE}/${functionName}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ============================================================
  // Public API Methods
  // ============================================================

  /**
   * Get all site settings
   */
  async function getSiteSettings() {
    return supabaseFetch('site_settings', { single: true });
  }

  /**
   * Get all published packs
   */
  async function getPacks(options = {}) {
    const filters = [{ column: 'is_published', value: true }];
    if (options.category) {
      filters.push({ column: 'category', value: options.category });
    }
    if (options.featured) {
      filters.push({ column: 'featured', value: true });
    }
    return supabaseFetch('packs', {
      filters,
      order: { column: 'download_count', asc: false },
      ...options,
    });
  }

  /**
   * Get a single pack by ID
   */
  async function getPack(packId) {
    return supabaseFetch('packs', {
      filters: [{ column: 'id', value: packId }],
      single: true,
    });
  }

  /**
   * Get versions for a pack
   */
  async function getVersions(packId) {
    return supabaseFetch('versions', {
      filters: [{ column: 'pack_id', value: packId }],
      order: { column: 'created_at', asc: false },
    });
  }

  /**
   * Get the latest version of a pack
   */
  async function getLatestVersion(packId) {
    return supabaseFetch('versions', {
      filters: [
        { column: 'pack_id', value: packId },
        { column: 'is_latest', value: true },
      ],
      single: true,
    });
  }

  /**
   * Get staff members
   */
  async function getStaff() {
    return supabaseFetch('staff', {
      filters: [{ column: 'is_active', value: true }],
      order: { column: 'sort_order', asc: true },
    });
  }

  /**
   * Get server rules
   */
  async function getRules() {
    return supabaseFetch('rules', {
      order: { column: 'sort_order', asc: true },
    });
  }

  /**
   * Get server features
   */
  async function getServerFeatures() {
    return supabaseFetch('server_features', {
      order: { column: 'sort_order', asc: true },
    });
  }

  /**
   * Track a download via Netlify Function (fire-and-forget)
   */
  async function trackDownload(packId, versionId) {
    try {
      await callFunction('track-download', { packId, versionId });
    } catch (e) {
      // Don't block the download for tracking
      console.warn('Download tracking failed:', e);
    }
  }

  /**
   * Increment download counter via function
   */
  async function incrementDownload(packId) {
    try {
      await callFunction('track-download', { packId });
    } catch (e) {
      console.warn('Download increment failed:', e);
    }
  }

  /**
   * Search packs by name/description
   */
  async function searchPacks(query) {
    // Use a simple approach: fetch all and filter (for static site)
    // In production, you'd use Supabase full-text search
    const allPacks = await getPacks();
    const q = query.toLowerCase().trim();
    return allPacks.filter(
      (pack) =>
        pack.name.toLowerCase().includes(q) ||
        pack.description.toLowerCase().includes(q) ||
        pack.short_description?.toLowerCase().includes(q) ||
        pack.category.toLowerCase().includes(q)
    );
  }

  /**
   * Get total download count across all packs
   */
  async function getTotalDownloads() {
    const packs = await getPacks();
    return packs.reduce((total, pack) => total + (pack.download_count || 0), 0);
  }

  // ============================================================
  // Minecraft Server API Integration
  // ============================================================

  /**
   * Fetch Minecraft server status from mcsrvstat.us
   */
  async function getServerStatus(serverIp) {
    if (!serverIp) return null;
    try {
      const response = await fetch(`https://api.mcsrvstat.us/2/${serverIp}`);
      if (!response.ok) throw new Error('Failed to fetch server status');
      const data = await response.json();
      return {
        online: data.online || false,
        players: {
          online: data.players?.online || 0,
          max: data.players?.max || 0,
        },
        version: data.version || 'Unknown',
        motd: data.motd?.clean?.join(' ') || '',
        icon: data.icon || null,
      };
    } catch (error) {
      console.warn('Server status fetch failed:', error);
      return { online: false, players: { online: 0, max: 0 }, error: error.message };
    }
  }

  // Return public methods
  return {
    supabaseFetch,
    callFunction,
    getSiteSettings,
    getPacks,
    getPack,
    getVersions,
    getLatestVersion,
    getStaff,
    getRules,
    getServerFeatures,
    trackDownload,
    incrementDownload,
    searchPacks,
    getTotalDownloads,
    getServerStatus,
  };
})();