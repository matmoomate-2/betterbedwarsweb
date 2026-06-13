/**
 * track-download - Increment download counters and log download
 */
const { getSupabaseClient } = require('./supabase-client');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { packId, versionId } = JSON.parse(event.body || '{}');

    if (!packId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'packId is required' }) };
    }

    const supabase = getSupabaseClient();

    // Increment pack download count
    const { error: packError } = await supabase.rpc('increment_pack_downloads', {
      pack_id_param: packId,
    });

    if (packError) {
      // Fallback: direct update
      await supabase
        .from('packs')
        .update({ download_count: supabase.rpc('increment', { x: 1 }) })
        .eq('id', packId);
    }

    // If versionId provided, increment version download count
    if (versionId) {
      await supabase
        .from('versions')
        .update({ downloads: supabase.rpc('increment', { x: 1 }) })
        .eq('id', versionId);
    }

    // Log the download
    await supabase.from('downloads').insert({
      pack_id: packId,
      version_id: versionId || null,
      ip_hash: hashIP(event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown'),
      user_agent: event.headers['user-agent'] || '',
      referrer: event.headers['referer'] || '',
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Track download error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

function hashIP(ip) {
  if (!ip || ip === 'unknown') return 'unknown';
  // Simple hash for privacy (use crypto in production)
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}