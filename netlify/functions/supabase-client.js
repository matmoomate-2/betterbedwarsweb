/**
 * Shared Supabase client for Netlify Functions
 */
const { createClient } = require('@supabase/supabase-js');

let supabase = null;

function getSupabaseClient() {
  if (supabase) return supabase;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  }

  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabase;
}

/**
 * Verify admin authentication
 */
function verifyAdminAuth(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader) {
    return { valid: false, error: 'Missing authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  const adminToken = process.env.ADMIN_SECRET_KEY;

  if (!adminToken) {
    return { valid: false, error: 'Admin secret not configured' };
  }

  if (token !== adminToken) {
    return { valid: false, error: 'Invalid authorization token' };
  }

  return { valid: true };
}

module.exports = { getSupabaseClient, verifyAdminAuth };