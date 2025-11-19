import { router } from "expo-router";
import { getAuth, onAuthStateChanged, signOut, updatePassword } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { app } from "../lib/firebase";
import { supabase } from "../lib/supabase";

export default function UserProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [userId, setUserId] = useState<string | null>(null);
  const auth = getAuth(app);

  // 🧠 Ambil data user saat pertama kali
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (!currentUser) {
          Alert.alert("Tidak terautentikasi", "Silakan login terlebih dahulu.");
          router.replace("/login");
          return;
        }

        setUserId(currentUser.uid);
        setEmail(currentUser.email ?? "");

        // Ambil data tambahan dari Supabase (nama & no HP)
        const { data: profile, error } = await supabase
          .from("users")
          .select("full_name, phone")
          .eq("id", currentUser.uid)
          .maybeSingle();

        if (error) throw error;

        setFullName(profile?.full_name || "");
        setPhone(profile?.phone || "");
      } catch (error: any) {
        console.error("Gagal memuat profil:", error);
        Alert.alert("Error", error.message || "Gagal memuat profil pengguna.");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // 💾 Simpan perubahan data user
  const handleSave = async () => {
    if (!userId) {
      Alert.alert("Error", "User tidak ditemukan. Silakan login ulang.");
      return;
    }

    if (!fullName.trim() || !phone.trim()) {
      Alert.alert("Validasi", "Nama dan nomor telepon wajib diisi.");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      Alert.alert("Validasi", "Password baru dan konfirmasi tidak cocok.");
      return;
    }

    try {
      setSaving(true);
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User tidak ditemukan.");

      // 🔒 Update password hanya jika diisi
      if (newPassword) {
        await updatePassword(currentUser, newPassword);
      }

      // 🧾 Update data ke tabel users Supabase
      const { error: updateError } = await supabase
        .from("users")
        .update({
          full_name: fullName,
          phone,
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      Alert.alert("Sukses", "Profil berhasil diperbarui ✅");
    } catch (error: any) {
      console.error("Gagal update profil:", error);
      Alert.alert("Gagal", error.message || "Terjadi kesalahan saat menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  // 🚪 Logout user
  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert("Logout", "Kamu telah keluar dari akun.");
      router.replace("/home");
    } catch (err: any) {
      console.error("Logout error:", err);
      Alert.alert("Gagal logout", err.message || "Coba lagi nanti.");
    }
  };

  // 📱 Loading state
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#a3e635" />
        <Text style={{ marginTop: 12, color: "#555" }}>Memuat profil...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Profil Saya</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Nama Lengkap</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Nama lengkap"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, { backgroundColor: "#e5e7eb" }]}
          value={email}
          editable={false}
          selectTextOnFocus={false}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Nomor Telepon</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="0812xxxx"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Password Baru (opsional)</Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Password baru"
          secureTextEntry
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Konfirmasi Password Baru</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Ulangi password baru"
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        style={[styles.button, saving && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Simpan Perubahan</Text>
        )}
      </TouchableOpacity>

      {/* Tombol Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: "#fff",
    minHeight: "100%",
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 18,
    color: "#1f2937",
  },
  field: { marginBottom: 16 },
  label: { color: "#6b7280", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f9fafb",
  },
  button: {
    marginTop: 12,
    backgroundColor: "#a3e635",
    padding: 14,
    alignItems: "center",
    borderRadius: 10,
  },
  buttonText: { color: "#1f2937", fontWeight: "700" },
  logoutBtn: {
    marginTop: 20,
    padding: 14,
    alignItems: "center",
  },
  logoutText: { color: "#ef4444", fontWeight: "700", fontSize: 16 },
});
