/**
 * MCP Authentication Layer
 *
 * Validates API keys and establishes user context for MCP requests.
 */
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
const SUPABASE_URL = process.env.CHQ_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.CHQ_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[MCP Auth] ERROR: Supabase credentials not found in environment');
    console.error('[MCP Auth] Required: CHQ_SUPABASE_URL and CHQ_SUPABASE_ANON_KEY');
}
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
/**
 * Hash an API key for database comparison
 */
function hashApiKey(apiKey) {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
}
/**
 * Validate an API key and return user context
 */
export async function validateApiKey(apiKey) {
    try {
        const keyHash = hashApiKey(apiKey);
        // Look up the API key in the database
        const { data: apiKeyRecord, error } = await supabase
            .from('api_keys')
            .select('*')
            .eq('key_hash', keyHash)
            .single();
        if (error || !apiKeyRecord) {
            console.error('[MCP Auth] Invalid API key');
            return null;
        }
        // Update last_used timestamp (fire and forget)
        void supabase
            .from('api_keys')
            .update({ last_used: new Date().toISOString() })
            .eq('id', apiKeyRecord.id);
        // Fetch user details
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(apiKeyRecord.user_id);
        if (userError || !userData.user) {
            console.error('[MCP Auth] User not found for API key');
            return null;
        }
        return {
            user: userData.user,
            apiKey,
            userId: apiKeyRecord.user_id,
        };
    }
    catch (error) {
        console.error('[MCP Auth] Error validating API key:', error);
        return null;
    }
}
/**
 * Initialize authentication context from environment
 */
export async function initializeAuth(apiKey) {
    return await validateApiKey(apiKey);
}
/**
 * Get Supabase client with service role for admin operations
 * (Used internally, not exposed to MCP clients)
 */
export function getSupabaseClient() {
    return supabase;
}
//# sourceMappingURL=auth.js.map