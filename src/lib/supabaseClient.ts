/**
 * Supabase Client — FusionAI Project
 * Project ID: ojzqbglulodbmuyomqqt
 */

const SUPABASE_URL = 'https://ojzqbglulodbmuyomqqt.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_rSXhbOEb3iT4qc720JNCCg_oKwlTVgD';

// Lightweight fetch-based Supabase client (no SDK dependency needed)
export const supabase = {
  url: SUPABASE_URL,
  key: SUPABASE_PUBLISHABLE_KEY,

  async insert(table: string, data: Record<string, any>) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const err = await response.text();
      console.error(`Supabase INSERT error on ${table}:`, err);
    }
    return response;
  },

  async update(table: string, data: Record<string, any>, match: Record<string, any>) {
    const params = new URLSearchParams(
      Object.entries(match).map(([k, v]) => [`${k}`, `eq.${v}`])
    ).toString();
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const err = await response.text();
      console.error(`Supabase UPDATE error on ${table}:`, err);
    }
    return response;
  },

  async select<T = any>(table: string, params?: Record<string, string>): Promise<T[]> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        'Accept': 'application/json'
      }
    });
    if (!response.ok) return [];
    return response.json();
  },

  async rpc<T = any>(fn: string, args: Record<string, any> = {}): Promise<T | null> {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(args)
    });
    if (!response.ok) return null;
    return response.json();
  }
};
