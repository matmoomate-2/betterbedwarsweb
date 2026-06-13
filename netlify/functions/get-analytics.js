/**
 * get-analytics - Get download analytics and page view data
 */
const { getSupabaseClient, verifyAdminAuth } = require('./supabase-client');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const auth = verifyAdminAuth(event);
  if (!auth.valid) {
    return { statusCode: 401, body: JSON.stringify({ error: auth.error }) };
  }

  try {
    const supabase = getSupabaseClient();
    const { period = '30d' } = event.queryStringParameters || {};

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case '7d': startDate.setDate(now.getDate() - 7); break;
      case '90d': startDate.setDate(now.getDate() - 90); break;
      case 'all': startDate = new Date(0); break;
      default: startDate.setDate(now.getDate() - 30);
    }

    // Total downloads
    const { data: packs } = await supabase.from('packs').select('id, name, download_count');
    const totalDownloads = packs?.reduce((sum, p) => sum + (p.download_count || 0), 0) || 0;

    // Downloads in period
    const { count: periodDownloads } = await supabase
      .from('downloads')
      .select('*', { count: 'exact', head: true })
      .gte('downloaded_at', startDate.toISOString());

    // Downloads by pack
    const { data: downloadsByPack } = await supabase
      .from('downloads')
      .select('pack_id')
      .gte('downloaded_at', startDate.toISOString());

    const packDownloads = {};
    if (downloadsByPack) {
      downloadsByPack.forEach((d) => {
        packDownloads[d.pack_id] = (packDownloads[d.pack_id] || 0) + 1;
      });
    }

    // Top packs
    const topPacks = (packs || [])
      .sort((a, b) => (b.download_count || 0) - (a.download_count || 0))
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        name: p.name,
        total_downloads: p.download_count || 0,
        period_downloads: packDownloads[p.id] || 0,
      }));

    // Total packs count
    const { count: totalPacks } = await supabase
      .from('packs')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);

    // Total versions count
    const { count: totalVersions } = await supabase
      .from('versions')
      .select('*', { count: 'exact', head: true });

    return {
      statusCode: 200,
      body: JSON.stringify({
        period,
        total_downloads: totalDownloads,
        period_downloads: periodDownloads || 0,
        total_packs: totalPacks || 0,
        total_versions: totalVersions || 0,
        top_packs: topPacks,
      }),
    };
  } catch (error) {
    console.error('Get analytics error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};