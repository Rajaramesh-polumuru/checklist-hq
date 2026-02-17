/**
 * MCP Resources (Read-Only Data Exposure)
 *
 * Resources allow AI clients to read checklist data without modifying it.
 */
import type { AuthContext } from './types.js';
/**
 * List all available resources for the authenticated user
 */
export declare function listResources(authContext: AuthContext): Promise<{
    resources: {
        uri: string;
        name: string;
        description: string;
        mimeType: string;
    }[];
}>;
/**
 * Read a specific resource by URI
 */
export declare function readResource(uri: string, authContext: AuthContext): Promise<{
    contents: {
        uri: string;
        mimeType: string;
        text: string;
    }[];
}>;
//# sourceMappingURL=resources.d.ts.map