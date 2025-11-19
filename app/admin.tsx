import { router } from "expo-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { app } from "../lib/firebase";
import { supabase } from "../lib/supabase";

export default function AdminScreen() {
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (!currentUser) {
          Alert.alert("Akses ditolak", "Silakan login terlebih dahulu.");
          router.replace("/login");
          return;
        }

        // 🔍 Ambil data user dari tabel Supabase berdasarkan UID Firebase
        const { data: profile, error } = await supabase
          .from("users")
          .select("full_name, role")
          .eq("id", currentUser.uid)
          .maybeSingle();

        if (error) throw error;

        // 🔧 Kalau data user tidak ada
        if (!profile) {
          console.warn("Data profil user tidak ditemukan, redirect ke home...");
          router.replace("/home");
          return;
        }

        // ✅ Kalau user bukan admin, arahkan tanpa popup
        if (profile.role !== "admin") {
          console.log("User bukan admin, redirect ke home...");
          router.replace("/home");
          return;
        }

        // ✅ Kalau admin, tampilkan datanya
        setUserName(profile.full_name || "Admin");
      } catch (err) {
        console.error("Gagal memverifikasi admin:", err);
        Alert.alert("Error", "Terjadi kesalahan saat memverifikasi akun.");
        router.replace("/home");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#a3e635" />
        <Text style={{ marginTop: 10, color: "#555" }}>Memuat...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={require("../assets/images/b2057.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>B2057 Garage — Admin Panel</Text>

        {/* SELAMAT DATANG - bisa diklik ke halaman user */}
        <TouchableOpacity onPress={() => router.push("/user")} activeOpacity={0.8}>
          <Text style={styles.welcome}>
            Selamat datang,
            <Text style={styles.loginText}> {userName || "Admin"}!</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* MENU UTAMA */}
      <View style={styles.mainMenu}>
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={() => router.push("/admin-antrian")}
        >
          <Text style={styles.btnText}>Kelola Antrian Servis</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={() => router.push("/order")}
        >
          <Text style={styles.btnText}>Kelola Order Masuk</Text>
        </TouchableOpacity>
      </View>

      {/* DESKRIPSI */}
      <View style={styles.descriptionSection}>
        <Text style={styles.infoTitle}>
          Mode Admin — Pantau dan kelola semua aktivitas bengkel
        </Text>
        <Text style={styles.infoDesc}>
          Di halaman ini, admin dapat melihat daftar order aktif, memeriksa
          status pengerjaan, serta mengatur layanan pelanggan dengan mudah.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  container: {
    flexGrow: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 60,
  },
  header: { alignItems: "center", marginBottom: 30 },
  logo: { width: 160, height: 160, marginBottom: 10 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
  },
  welcome: { color: "#6b7280", marginTop: 5, fontSize: 16 },
  loginText: { color: "#a3e635", fontWeight: "700" },
  mainMenu: {
    width: "100%",
    marginTop: 20,
    gap: 15,
  },
  btn: {
    borderWidth: 2,
    borderColor: "#a3e635",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  btnPrimary: { backgroundColor: "#a3e635" },
  btnSecondary: { backgroundColor: "transparent" },
  btnText: { color: "#1f2937", fontWeight: "600", fontSize: 16 },
  descriptionSection: {
    marginTop: 40,
    backgroundColor: "#f9fafb",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 10,
  },
  infoDesc: {
    color: "#4b5563",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});
