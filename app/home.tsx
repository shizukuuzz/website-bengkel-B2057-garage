import { router } from "expo-router";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
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

export default function HomeScreen() {
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);

  // 🔍 Cek user login via Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser: User | null) => {
      try {
        if (currentUser) {
          setUserId(currentUser.uid);

          // Ambil nama dan role dari Supabase
          const { data, error } = await supabase
            .from("users")
            .select("full_name, role")
            .eq("id", currentUser.uid)
            .maybeSingle();

          if (error) throw error;

          // 🚀 Kalau admin, arahkan ke admin panel
          if (data?.role === "admin") {
            router.replace("/admin");
            return;
          }

          setUserName(data?.full_name || "Pengguna");
        } else {
          // Tidak login
          setUserId(null);
          setUserName(null);
        }
      } catch (err: any) {
        console.error("Gagal memuat user:", err.message);
        Alert.alert("Error", "Gagal memuat data pengguna.");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // ⏳ Loading screen
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#a3e635" />
        <Text style={{ marginTop: 10, color: "#555" }}>Memuat data...</Text>
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

        <Text style={styles.title}>B2057 Garage</Text>

        {/* SELAMAT DATANG */}
        <TouchableOpacity
          onPress={() => {
            if (!userName) {
              router.push("/login"); // belum login
            } else {
              router.push("/user"); // sudah login → ke profil
            }
          }}
        >
          <Text style={styles.welcome}>
            Selamat datang,
            <Text style={styles.loginText}>
              {" "}
              {userName ? userName + "!" : "LOGIN!"}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* MENU UTAMA */}
      <View style={styles.mainMenu}>
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={() => router.push("/antrian")}
        >
          <Text style={styles.btnText}>Lihat Antrian Servis</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={() => router.push("/order")}
        >
          <Text style={styles.btnText}>Order Servis Baru</Text>
        </TouchableOpacity>
      </View>

      {/* DESKRIPSI */}
      <View style={styles.descriptionSection}>
        <Text style={styles.infoTitle}>
          Bengkel Motor Profesional dengan Jasa Antar Jemput
        </Text>
        <Text style={styles.infoDesc}>
          B2057 Garage adalah solusi terpercaya untuk semua kebutuhan servis
          motor Anda. Kami menyediakan layanan antar jemput agar lebih mudah dan
          efisien. Dikerjakan oleh mekanik berpengalaman dengan hasil yang
          memuaskan.
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
    paddingTop: 60,
    paddingBottom: 60,
  },
  header: { alignItems: "center", marginBottom: 30 },
  logo: { width: 160, height: 160, marginBottom: 10 },
  title: { fontSize: 26, fontWeight: "700", color: "#1f2937" },
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
