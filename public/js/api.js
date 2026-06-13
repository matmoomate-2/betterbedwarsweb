/**
 * Better Bedwars - API Module
 * Handles all data fetching from Supabase and Netlify Functions
 */

const API = (() => {
  // Use environment variable or default to local dev
  // For production, use Netlify snippet injection to set window.SUPABASE_URL and window.SUPABASE_ANON_KEY
  const SUPABASE_URL = window.SUPABASE_URL || 'https://ciyzlhoxwanclkrrsikb.supabase.co';
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpeXpsaG94d2FuY2xrcnJzaWtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDM5NDEsImV4cCI6MjA5NjkxOTk0MX0.lqJaD93lUUEGX2Qp0n5kMKPc5FcotDO_KiwifbpX3TI';
  const FUNCTIONS_BASE = '/.netlify/functions';

  // Fallback data for when database is unavailable
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
      description: 'The ultimate Bedwars texture pack designed for clarity, performance, and style. Features crisp textures, optimized models, and vibrant colors to give you the competitive edge.',
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
      description: 'A clean overlay pack designed to work perfectly with Lunar Client. Enhances your PvP experience without changing too much.',
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
      description: 'A Bedwars version of the classic Faithful pack. Maintains the original Minecraft feel while optimizing for Bedwars.',
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
    {
      id: 'fb-v3',
      pack_id: 'better-bedwars',
      version: '3.0.0',
      changelog: '## What\'s New in 3.0.0\n- Complete redesign of all armor textures\n- New sword textures with better visibility\n- Optimized all block textures for performance\n- Fixed glass pane connected textures\n- Added support for 1.21',
      file_url: '#',
      file_size: 15728640,
      minecraft_version: '1.8.9 - 1.21',
      is_latest: true,
      downloads: 15234,
      created_at: '2024-06-01T00:00:00Z',
    },
    {
      id: 'fb-v2',
      pack_id: 'better-bedwars',
      version: '2.5.0',
      changelog: '## Changes in 2.5.0\n- Updated hotbar selection indicator\n- New bow pull textures\n- Improved potion color visibility\n- Fixed minor GUI inconsistencies',
      file_url: '#',
      file_size: 14680064,
      minecraft_version: '1.8.9 - 1.20',
      is_latest: false,
      downloads: 8921,
      created_at: '2024-03-20T00:00:00Z',
    },
    {
      id: 'fb-v1',
      pack_id: 'better-bedwars',
      version: '2.0.0',
      changelog: '## Major Update 2.0.0\n- Full 64x resolution upgrade\n- New animated block textures\n- Redesigned UI elements\n- Better crosshair options\n- Performance improvements',
      file_url: '#',
      file_size: 12582912,
      minecraft_version: '1.8.9 - 1.19',
      is_latest: false,
      downloads: 24567,
      created_at: '2024-01-05T00:00:00Z',
    }
  ];

  const FALLBACK_STAFF = [
    { id: 's1', name: 'Techno', role: 'Owner', rank: 'Admin', sort_order: 1 },
    { id: 's2', name: 'DreamWasTaken', role: 'Developer', rank: 'Admin', sort_order: 2 },
    { id: 's3', name: 'George', role: 'Moderator', rank: 'Mod', sort_order: 3 },
    { id: 's4', name: 'Sapnap', role: 'Moderator', rank: 'Mod', sort_order: 4 },
    { id: 's5', name: 'BadBoyHalo', role: 'Helper', rank: 'Helper', sort_order: 5 },
  ];

  const FALLBACK_RULES = [
    { id: 'r1', title: 'No Cheating', description: 'Use of hacks, cheats, or unfair modifications is strictly prohibited.', category: 'General', sort_order: 1 },
    { id: 'r2', title: 'Respect Others', description: 'Treat all players with respect. No harassment, racism, or toxicity.', category: 'General', sort_order: 2 },
    { id: 'r3', title: 'No Griefing', description: 'Destroying or stealing from other players is not allowed.', category: 'General', sort_order: 3 },
    { id: 'r4', title: 'No Spamming', description: 'Do not spam chat, advertisements, or inappropriate content.', category: 'Chat', sort_order: 4 },
    { id: 'r5', title: 'No Hacked Clients', description: 'Using hacked clients or modifications that give unfair advantages is bannable.', category: 'General', sort_order: 5 },
  ];

  const FALLBACK_FEATURES = [
    { id: 'f1', title: '24/7 Uptime', description: 'Our servers run around the clock with 99.9% uptime guarantee.', icon: 'server', sort_order: 1 },
    { id: 'f2', title: 'Anti-Cheat Protection', description: 'Advanced anti-cheat systems keep the game fair for everyone.', icon: 'shield', sort_order: 2 },
    { id: 'f3', title: 'Dedicated Staff', description: 'Our team is always ready to help with any issues.', icon: 'users', sort_order: 3 },
    { id: 'f4', title: 'Regular Updates', description: 'New features and improvements added regularly.', icon: 'refresh', sort_order: 4 },
    { id: 'f5', title: 'Active Community', description: 'Join thousands of active players in our Discord community.', icon: 'discord', sort_order: 5 },
  ];

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
        // Use proper Supabase filter format: column=operator.value
        url += `&${filter.column}=${operator}.${encodeURIComponent(String(filter.value))}`;
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
   * Get all site settings - returns fallback on failure
   */
  async function getSiteSettings() {
    try {
      const result = await supabaseFetch('site_settings', { single: true });
      return result || FALLBACK_SETTINGS;
    } catch (error) {
      console.warn('Site settings unavailable, using fallbacks:', error.message);
      return FALLBACK_SETTINGS;
    }
  }

  /**
   * Get all published packs - returns fallback on failure
   */
  async function getPacks(options = {}) {
    try {
      const filters = [{ column: 'is_published', value: true }];
      if (options.category) {
        filters.push({ column: 'category', value: options.category });
      }
      if (options.featured) {
        filters.push({ column: 'featured', value: true });
      }
      const result = await supabaseFetch('packs', {
        filters,
        order: { column: 'download_count', asc: false },
        ...options,
      });
      return result && result.length > 0 ? result : FALLBACK_PACKS;
    } catch (error) {
      console.warn('Packs unavailable, using fallbacks:', error.message);
      return FALLBACK_PACKS;
    }
  }

  /**
   * Get a single pack by ID - returns fallback on failure
   */
  async function getPack(packId) {
    try {
      const result = await supabaseFetch('packs', {
        filters: [{ column: 'id', value: packId }],
        single: true,
      });
      return result || FALLBACK_PACKS.find(p => p.id === packId) || FALLBACK_PACKS[0];
    } catch (error) {
      console.warn('Pack unavailable, using fallback:', error.message);
      return FALLBACK_PACKS.find(p => p.id === packId) || FALLBACK_PACKS[0];
    }
  }

  /**
   * Get versions for a pack - returns fallback on failure
   */
  async function getVersions(packId) {
    try {
      const result = await supabaseFetch('versions', {
        filters: [{ column: 'pack_id', value: packId }],
        order: { column: 'created_at', asc: false },
      });
      return result && result.length > 0 ? result : FALLBACK_VERSIONS;
    } catch (error) {
      console.warn('Versions unavailable, using fallbacks:', error.message);
      return FALLBACK_VERSIONS;
    }
  }

  /**
   * Get the latest version of a pack
   */
  async function getLatestVersion(packId) {
    try {
      const result = await supabaseFetch('versions', {
        filters: [
          { column: 'pack_id', value: packId },
          { column: 'is_latest', value: true },
        ],
        single: true,
      });
      return result || FALLBACK_VERSIONS[0];
    } catch (error) {
      console.warn('Latest version unavailable, using fallback:', error.message);
      return FALLBACK_VERSIONS[0];
    }
  }

  /**
   * Get staff members - returns fallback on failure
   */
  async function getStaff() {
    try {
      const result = await supabaseFetch('staff', {
        filters: [{ column: 'is_active', value: true }],
        order: { column: 'sort_order', asc: true },
      });
      return result || FALLBACK_STAFF;
    } catch (error) {
      console.warn('Staff unavailable, using fallbacks:', error.message);
      return FALLBACK_STAFF;
    }
  }

  /**
   * Get server rules - returns fallback on failure
   */
  async function getRules() {
    try {
      const result = await supabaseFetch('rules', {
        order: { column: 'sort_order', asc: true },
      });
      return result || FALLBACK_RULES;
    } catch (error) {
      console.warn('Rules unavailable, using fallbacks:', error.message);
      return FALLBACK_RULES;
    }
  }

  /**
   * Get server features - returns fallback on failure
   */
  async function getServerFeatures() {
    try {
      const result = await supabaseFetch('server_features', {
        order: { column: 'sort_order', asc: true },
      });
      return result || FALLBACK_FEATURES;
    } catch (error) {
      console.warn('Server features unavailable, using fallbacks:', error.message);
      return FALLBACK_FEATURES;
    }
  }

  /**
   * Track a download via Netlify Function (fire-and-forget)
   */
  async function trackDownload(packId, versionId) {
    try {
      await callFunction('track-download', { packId, versionId });
    } catch (e) {
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
    const allPacks = await getPacks();
    const q = query.toLowerCase().trim();
    return allPacks.filter(
      (pack) =>
        pack.name.toLowerCase().includes(q) ||
        (pack.description || '').toLowerCase().includes(q) ||
        (pack.short_description || '').toLowerCase().includes(q) ||
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
    if (!serverIp || serverIp === '#') return null;
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