import { createClient } from '@supabase/supabase-js';

// Test database configuration - connects to local Supabase
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'; // Default local anon key from supabase start

export const testSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to verify test database connection
export async function verifyTestConnection() {
  try {
    const { data, error } = await testSupabase.from('providers').select('count', { count: 'exact' });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Test database connection failed:', error);
    return false;
  }
}

// Helper to get known test data IDs for predictable testing
export async function getTestDataIds() {
  const { data: providers } = await testSupabase.from('providers').select('id, name').limit(3);
  const { data: gpus } = await testSupabase.from('gpu_models').select('id, name, slug').limit(3);
  
  return {
    providers: providers || [],
    gpus: gpus || []
  };
}