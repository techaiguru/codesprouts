import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://qcweatwzraxnngihypth.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjd2VhdHd6cmF4bm5naWh5cHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MDIyMjUsImV4cCI6MjA2NjE3ODIyNX0.b0TLzm-ZjX9kzoPIluLvNjhGuwu6T2g5AUCVupWnxqQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Edge function URLs
export const EDGE_FUNCTIONS = {
  WHOIS_LOOKUP: `${supabaseUrl}/functions/v1/whois-lookup`,
} as const;
