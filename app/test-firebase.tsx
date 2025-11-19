import React, { useEffect } from "react";
import { Text, View } from "react-native";
import { auth } from "../lib/firebase";

export default function TestFirebase() {
  useEffect(() => {
    console.log("Firebase Auth object:", auth);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 18, fontWeight: "600" }}>🔥 Firebase Terhubung!</Text>
      <Text style={{ color: "#666", marginTop: 6 }}>Cek console di Metro bundler</Text>
    </View>
  );
}
