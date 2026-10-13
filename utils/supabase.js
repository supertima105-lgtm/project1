// Supabase client helper for JavaScript
const supabaseUrl = (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_URL) || (typeof window !== 'undefined' && window.VITE_SUPABASE_URL) || '';
const supabaseKey = (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_PUBLISHABLE_KEY) || (typeof window !== 'undefined' && window.VITE_SUPABASE_PUBLISHABLE_KEY) || '';

let supabaseClient = null;
if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
  supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
}

export { supabaseUrl, supabaseKey, supabaseClient as supabase };
