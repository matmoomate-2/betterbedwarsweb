/**
 * upload-version - Add a new version to a pack
 */
const { getSupabaseClient, verifyAdminAuth } = require('./supabase-client');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const auth = verifyAdminAuth(event);
  if (!auth.valid) {
    return { statusCode: 401, body: JSON.stringify({ error: auth.error }) };
  }

  try {
    const versionData = JSON.parse(event.body || '{}');
    const supabase = getSupabaseClient();

    const {
      pack_id,
      version,
      changelog,
      file_url,
      file_size,
      file_format,
      minecraft_version,
      is_latest,
    } = versionData;

    if (!pack_id || !version || !file_url) {
      return { statusCode: 400, body: JSON.stringify({ error: 'pack_id, version, and file_url are required' }) };
    }

    // If this is marked as latest, unmark all other versions first
    if (is_latest) {
      await supabase
        .from('versions')
        .update({ is_latest: false })
        .eq('pack_id', pack_id);
    }

    // Insert the new version
    const { data, error } = await supabase.from('versions').upsert(
      {
        pack_id,
        version,
        changelog: changelog || '',
        file_url,
        file_size: file_size || 0,
        file_format: file_format || '.zip',
        minecraft_version: minecraft_version || '',
        is_latest: is_latest || false,
      },
      { onConflict: 'pack_id,version' }
    );

    if (error) {
      console.error('Upload version error:', error);
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data }),
    };
  } catch (error) {
    console.error('Upload version error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};