// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fsejiqjkakgfqeukhmnd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWppcWprYWtnZnFldWtobW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNjAxOTEsImV4cCI6MjA2NzgzNjE5MX0.Xri-_TvOhSVw-6j814teA3nZZEotUaVA0dz0Ngh52w8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
