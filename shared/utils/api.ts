/**
 * Base URL of the .NET backend API. Reads NEXT_PUBLIC_API_BASE_URL (set in
 * Vercel/production) and falls back to the local dev backend so nothing
 * breaks running locally without a .env.local set up.
 *
 * Previously this was hardcoded to "http://localhost:5216" in several
 * files - which meant the deployed frontend always tried to reach the
 * visitor's own machine instead of the real backend.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5216";
