#!/usr/bin/env node
/**
 * MCP Server CLI
 * 
 * Usage:
 *   node cli.ts --user-id <user_id>
 * 
 * Environment variables:
 *   CHECKLIST_USER_ID - User ID to run the server for
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_ANON_KEY - Supabase anonymous key
 */

import { runMCPServer } from './server';

async function main() {
  // Get user ID from command line args or environment
  const args = process.argv.slice(2);
  const userIdIndex = args.indexOf('--user-id');
  const userId =
    userIdIndex !== -1
      ? args[userIdIndex + 1]
      : process.env.CHECKLIST_USER_ID;

  if (!userId) {
    console.error('Error: User ID is required');
    console.error('Usage: node cli.ts --user-id <user_id>');
    console.error('Or set CHECKLIST_USER_ID environment variable');
    process.exit(1);
  }

  // Validate environment variables
  if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    console.error('Error: Supabase environment variables not set');
    console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  try {
    await runMCPServer(userId);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
