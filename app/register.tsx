import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";
import { app } from "../lib/firebase";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const auth = getAuth(app);

  const handleRegister = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert("Error", "Semua kolom wajib diisi!");
      return;
    }

    try {
      setLoading(true);

      // 🔹 1. Buat akun Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // 🔹 2. Update nama ke Firebase
      await updateProfile(firebaseUser, { displayName: name });

      // 🔹 3. Kirim email verifikasi
      await sendEmailVerification(firebaseUser);

      // 🔹 4. Simpan profil ke Supabase
      const { error: insertError } = await supabase.from("users").insert([
        {
          id: firebaseUser.uid,
          full_name: name,
          email,
          phone,
          role: "user",
        },
      ]);

      if (insertError) throw insertError;

      // 🔹 5. Tampilkan pesan
      Alert.alert(
        "Verifikasi Diperlukan",
  "Kami telah mengirim email verifikasi ke alamat email kamu.\n\n" +
  "Silakan buka email tersebut dan klik tautan verifikasi untuk mengaktifkan akun kamu.\n\n" +
  "📩 Jika belum menemukan emailnya, coba periksa folder *Spam* atau *Promosi*. " +
  "Pastikan kamu membuka email dari B2057 Garage."
      );

      // Logout dulu biar user gak bisa langsung login sebelum verifikasi
      await auth.signOut();

      router.replace("/login");
    } catch (err: any) {
      console.error("Register error:", err);
      Alert.alert("Gagal", err.message || "Terjadi kesalahan saat registrasi.");
    } finally {
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
        <Text style={styles.title}>Buat Akun Baru</Text>

        <TextInput
          style={styles.input}
          placeholder="Nama Lengkap"
          placeholderTextColor="#6b7280"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#6b7280"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Nomor Telepon"
          placeholderTextColor="#6b7280"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput
          style={styles.input}
          placeholder="Buat Password"
          placeholderTextColor="#6b7280"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "MENDAFTAR..." : "DAFTAR"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.switchText}>
          Sudah punya akun?{" "}
          <Text style={styles.switchLink} onPress={() => router.push("/login")}>
            Login di sini
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
