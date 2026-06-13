/**
 * update-site-settings - Update all site settings from admin panel
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
    const settings = JSON.parse(event.body || '{}');
    const supabase = getSupabaseClient();

    // Allowed fields that can be updated
    const allowedFields = [
      'site_name',
      'description',
      'hero_title',
      'hero_subtitle',
      'announcement_text',
      'announcement_enabled',
      'announcement_type',
      'featured_pack_id',
      'discord_url',
      'youtube_url',
      'github_url',
      'email_contact',
      'server_ip',
      'server_name',
      'footer_text',
      'footer_links',
      'primary_color',
      'secondary_color',
      'accent_color',
      'dark_bg',
      'dark_surface',
      'dark_card',
      'border_color',
      'text_primary',
      'text_secondary',
    ];

    const sanitizedSettings = {};
    for (const key of Object.keys(settings)) {
      if (allowedFields.includes(key)) {
        sanitizedSettings[key] = settings[key];
      }
    }

    if (Object.keys(sanitizedSettings).length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No valid settings to update' }) };
    }

    sanitizedSettings.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('site_settings')
      .update(sanitizedSettings)
      .eq('id', 'global')
      .select();

    if (error) {
      console.error('Update site settings error:', error);
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: data[0] }),
    };
  } catch (error) {
    console.error('Update site settings error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};