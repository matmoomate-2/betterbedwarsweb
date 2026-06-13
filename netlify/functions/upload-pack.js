/**
 * upload-pack - Create or update a texture pack entry
 */
const { getSupabaseClient, verifyAdminAuth } = require('./supabase-client');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Verify admin authentication
  const auth = verifyAdminAuth(event);
  if (!auth.valid) {
    return { statusCode: 401, body: JSON.stringify({ error: auth.error }) };
  }

  try {
    const packData = JSON.parse(event.body || '{}');
    const supabase = getSupabaseClient();

    const {
      id,
      name,
      description,
      short_description,
      category,
      minecraft_versions,
      author,
      icon_url,
      banner_url,
      screenshots,
      featured,
      is_published,
    } = packData;

    if (!id || !name) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Pack ID and name are required' }) };
    }

    // Upsert (insert or update)
    const { data, error } = await supabase.from('packs').upsert(
      {
        id,
        name,
        description: description || '',
        short_description: short_description || '',
        category: category || 'other',
        minecraft_versions: minecraft_versions || [],
        author: author || 'Better Bedwars Team',
        icon_url: icon_url || '',
        banner_url: banner_url || '',
        screenshots: screenshots || [],
        featured: featured || false,
        is_published: is_published !== false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.error('Upload pack error:', error);
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data }),
    };
  } catch (error) {
    console.error('Upload pack error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};