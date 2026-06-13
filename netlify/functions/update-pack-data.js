/**
 * update-pack-data - Update pack metadata (changelog, screenshots, etc.)
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
    const { packId, updates } = JSON.parse(event.body || '{}');
    const supabase = getSupabaseClient();

    if (!packId || !updates) {
      return { statusCode: 400, body: JSON.stringify({ error: 'packId and updates are required' }) };
    }

    // Only allow specific fields to be updated
    const allowedFields = [
      'name',
      'description',
      'short_description',
      'category',
      'minecraft_versions',
      'author',
      'icon_url',
      'banner_url',
      'screenshots',
      'featured',
      'is_published',
    ];

    const sanitizedUpdates = {};
    for (const key of Object.keys(updates)) {
      if (allowedFields.includes(key)) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No valid fields to update' }) };
    }

    sanitizedUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('packs')
      .update(sanitizedUpdates)
      .eq('id', packId)
      .select();

    if (error) {
      console.error('Update pack data error:', error);
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data }),
    };
  } catch (error) {
    console.error('Update pack data error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};