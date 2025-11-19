import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔑 Ambil environment variables dari Supabase
const SUPABASE_URL = Deno.env.get("PROJECT_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 🚀 Jalankan serverless function
Deno.serve(async (req) => {
  try {
    const { name, email, phone, password } = await req.json();

    // Validasi input
    if (!email || !password || !name || !phone) {
      return new Response(JSON.stringify({ error: "Semua kolom wajib diisi." }), {
        status: 400,
      });
    }

    // 🔹 1. Buat akun di Supabase Auth (email + password)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
          role: "user",
        },
      },
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
      });
    }

    // 🔹 2. Simpan data tambahan ke tabel users
    const { error: insertError } = await supabase.from("users").insert([
      {
        id: authData.user?.id, // Hubungkan user.id dengan auth.users.id
        name,
        email,
        phone,
        role: "user",
      },
    ]);

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 400,
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Registrasi berhasil!" }),
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
