// Supabase shim for the Base44-backed build.
// The original app used Supabase for storage + auth; in this build we use
// Base44 entities + auth instead. We keep these exports so legacy code paths
// that still import them don't blow up at module load.
//
// `isSupabaseConfigured()` returns `false`, so any code that branches on it
// will take the non-Supabase path.

export function isSupabaseConfigured() {
  return false;
}

export const supabase = null;
export const getSupabaseAdmin = () => null;
export default supabase;
