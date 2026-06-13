/**
 * admin-auth - Verify admin credentials and return a session token
 */
const { getSupabaseClient } = require('./supabase-client');

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { username, password } = JSON.parse(event.body || '{}');

    if (!username || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Username and password are required' }) };
    }

    const supabase = getSupabaseClient();

    // Look up admin user
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (error || !admin) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid credentials' }) };
    }

    // Verify password (use bcrypt in production)
    // For now, simple comparison - in production, use bcrypt.compare()
    if (password !== admin.password_hash) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid credentials' }) };
    }

    // Use the ADMIN_SECRET_KEY directly as the session token
    // verifyAdminAuth() compares this against the stored secret
    const token = process.env.ADMIN_SECRET_KEY;

    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

    return {
      statusCode: 200,
      body: JSON.stringify({
        token,
        user: {
          id: admin.id,
          username: admin.username,
          display_name: admin.display_name,
          role: admin.role,
        },
      }),
    };
  } catch (error) {
    console.error('Admin auth error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};