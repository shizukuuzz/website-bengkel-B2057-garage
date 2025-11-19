// app/verify.tsx
import { useEffect } from "react";
import { View, Text } from "react-native";
import { router } from "expo-router";

export default function VerifyScreen() {
  useEffect(() => {
    setTimeout(() => {
      router.replace("/login");
    }, 2000); // pindah ke login dalam 2 detik
  }, []);

  return (
    <View style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#fff"
    }}>
      <Text style={{ fontSize: 18, fontWeight: "bold", color: "#111" }}>
        ✅ Email kamu sudah terverifikasi!
      </Text>
      <Text style={{ marginTop: 10, color: "#555" }}>
        Mengarahkan ke halaman login...
      </Text>
    </View>
  );
}
