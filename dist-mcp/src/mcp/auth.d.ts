/**
 * MCP Authentication Layer
 *
 * Validates API keys and establishes user context for MCP requests.
 */
import type { AuthContext } from './types.js';
/**
 * Validate an API key and return user context
 */
export declare function validateApiKey(apiKey: string): Promise<AuthContext | null>;
/**
 * Initialize authentication context from environment
 */
export declare function initializeAuth(apiKey: string): Promise<AuthContext | null>;
/**
 * Get Supabase client with service role for admin operations
 * (Used internally, not exposed to MCP clients)
 */
export declare function getSupabaseClient(): import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
//# sourceMappingURL=auth.d.ts.map