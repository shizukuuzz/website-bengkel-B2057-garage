import { router } from "expo-router";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../lib/firebase"; // 🔥 gunakan auth dari firebase.ts yang sudah pakai AsyncStorage
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(""); // bisa email atau nomor HP
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert("Error", "Masukkan email/nomor HP dan password!");
      return;
    }

    try {
      setLoading(true);

      let emailToLogin = identifier;

      // 🔍 Kalau bukan email, cari email berdasarkan nomor HP di Supabase
      if (!identifier.includes("@")) {
        const { data, error } = await supabase
          .from("users")
          .select("email")
          .eq("phone", identifier)
          .maybeSingle();

        if (error || !data) {
          Alert.alert("Error", "Nomor telepon tidak ditemukan!");
          setLoading(false);
          return;
        }

        emailToLogin = data.email;
      }

      // 🔐 Login pakai Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        emailToLogin,
        password
      );
      const firebaseUser = userCredential.user;

      if (!firebaseUser) {
        throw new Error("Gagal login. Akun tidak ditemukan.");
      }

      // 🕓 Tunggu Auth state siap sebelum ambil data user
      onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          try {
            // 🔗 Ambil data dari Supabase berdasarkan UID Firebase
            const { data: userProfile, error: profileError } = await supabase
              .from("users")
              .select("full_name, role")
              .eq("id", currentUser.uid)
              .maybeSingle();

            if (profileError || !userProfile) {
              Alert.alert("Error", "Data profil tidak ditemukan di database.");
              return;
            }

            const { full_name, role } = userProfile;

            Alert.alert("Berhasil", `Selamat datang, ${full_name || "Pengguna"}!`);

            // 🚪 Arahkan sesuai role
            if (role === "admin") {
              router.replace("/admin");
            } else {
              router.replace("/home");
            }
          } catch (error) {
            console.error("Error ambil profil:", error);
            Alert.alert("Error", "Gagal memuat profil pengguna.");
          } finally {
            setLoading(false);
          }
        }
      });
    } catch (err: any) {
      console.error("Login error:", err);
      Alert.alert("Login gagal", err.message || "Terjadi kesalahan saat login.");
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={require("../assets/images/b2057.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.formBox}>
        <Text style={styles.title}>Login Akun</Text>

        <TextInput
          style={styles.input}
          placeholder="Email atau Nomor Telepon"
          placeholderTextColor="#6b7280"
          keyboardType="email-address"
          value={identifier}
          onChangeText={setIdentifier}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#6b7280"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "MEMPROSES..." : "LOGIN"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.switchText}>
          Belum punya akun?{" "}
          <Text
            style={styles.switchLink}
            onPress={() => router.push("/register")}
          >
            Daftar sekarang
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 25,
  },
  formBox: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 25,
    color: "#1f2937",
  },
  input: {
    width: "100%",
    backgroundColor: "#f9fafb",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 16,
    color: "#1f2937",
    marginBottom: 16,
  },
  button: {
    width: "100%",
    backgroundColor: "#a3e635",
    borderRadius: 8,
    alignItems: "center",
    padding: 14,
    marginTop: 10,
  },
  buttonText: {
    color: "#1f2937",
    fontSize: 16,
    fontWeight: "600",
  },
  switchText: {
    marginTop: 20,
    color: "#6b7280",
  },
  switchLink: {
    color: "#a3e635",
    fontWeight: "600",
  },
});
