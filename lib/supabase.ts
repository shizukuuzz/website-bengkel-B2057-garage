import { createClient } from '@supabase/supabase-js';

// TULIS LANGSUNG URL DAN KEY ANDA DI SINI (JANGAN PAKA process.env DULU)
// Pastikan string-nya di dalam tanda kutip " "
const supabaseUrl = "https://gantidenganurlprojectanda.supabase.co";
const supabaseAnonKey = "eyJhbgantidengankeypanjanganda...";

// Buat koneksi
export const supabase = createClient(supabaseUrl, supabaseAnonKey);