import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
  StatusBar,
  Modal,
  TextInput,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAuth } from "firebase/auth";
import { app } from "../lib/firebase";
import { supabase } from "../lib/supabase";

export default function UserOrderScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [newMotor, setNewMotor] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [region, setRegion] = useState({
    latitude: -7.5629, // default Solo
    longitude: 110.8251,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const auth = getAuth(app);

  useEffect(() => {
    fetchUserOrders();
  }, []);

  const fetchUserOrders = async () => {
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const { data, error } = await supabase
        .from("orders")
        .select("id, motor, maps_link, status, order_time, finish_time")
        .eq("user_id", currentUser.uid)
        .order("order_time", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      console.error("Gagal memuat order:", err.message);
      Alert.alert("Error", "Gagal memuat data order.");
    } finally {
      setLoading(false);
    }
  };

  // Dapatkan lokasi user sekarang
  const handleUseMyLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Izin diperlukan", "Izinkan akses lokasi untuk melanjutkan.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      setRegion((prev) => ({
        ...prev,
        latitude,
        longitude,
      }));
      setLocation({ lat: latitude, lng: longitude });
    } catch (err: any) {
      console.error("Lokasi error:", err);
      Alert.alert("Error", "Tidak dapat mengambil lokasi.");
    }
  };

  const handleAddOrder = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "User belum login.");
      return;
    }

    if (!newMotor.trim() || !location) {
      Alert.alert("Validasi", "Motor dan lokasi wajib diisi!");
      return;
    }

    const mapsLink = `https://maps.google.com/?q=${location.lat},${location.lng}`;

    try {
      const { error } = await supabase.from("orders").insert([
        {
          user_id: user.uid,
          motor: newMotor,
          maps_link: mapsLink,
          status: "menunggu",
          order_time: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      setShowModal(false);
      setNewMotor("");
      setLocation(null);
      fetchUserOrders();
      Alert.alert("Sukses", "Order baru berhasil dibuat ✅");
    } catch (err: any) {
      console.error("Gagal menambah order:", err.message);
      Alert.alert("Error", "Gagal membuat order baru.");
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#a3e635" />
        <Text style={{ marginTop: 10, color: "#555" }}>Memuat order...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* HEADER BAR */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchUserOrders}>
            <Text style={styles.refreshText}>↻</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowModal(true)}
          >
            <Text style={styles.addText}>+ Order Baru</Text>
          </TouchableOpacity>
        </View>

        {/* TABEL ORDER */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            <View style={[styles.row, styles.headerRow]}>
              {[
                "No",
                "Motor",
                "Lokasi",
                "Status",
                "Nota",
                "Chat",
                "Waktu Order",
                "Waktu Selesai",
              ].map((h, i) => (
                <Text key={i} style={[styles.cell, styles.headerCell]}>
                  {h}
                </Text>
              ))}
            </View>

            {orders.length === 0 ? (
              <Text
                style={{
                  marginTop: 20,
                  textAlign: "center",
                  width: "100%",
                  color: "#555",
                }}
              >
                Belum ada order.
              </Text>
            ) : (
              orders.map((order, index) => (
                <View key={order.id} style={styles.row}>
                  <Text style={styles.cell}>{index + 1}</Text>
                  <Text style={styles.cell}>{order.motor}</Text>

                  <TouchableOpacity
                    onPress={() => Linking.openURL(order.maps_link)}
                  >
                    <Text style={[styles.cell, { color: "#3b82f6" }]}>Lihat</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      { backgroundColor: statusColor(order.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>{order.status}</Text>
                  </TouchableOpacity>

                  <Text style={[styles.cell, { color: "#a855f7" }]}>Nota</Text>
                  <Text style={[styles.cell, { color: "#10b981" }]}>Chat</Text>

                  <Text style={styles.cell}>{formatDate(order.order_time)}</Text>
                  <Text style={styles.cell}>{formatDate(order.finish_time)}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* MODAL ORDER BARU */}
        <Modal visible={showModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Buat Order Baru</Text>

              <MapView
                style={styles.map}
                region={region}
                onRegionChangeComplete={(r) => setRegion(r)}
              >
                <Marker
                  draggable
                  coordinate={{
                    latitude: region.latitude,
                    longitude: region.longitude,
                  }}
                  onDragEnd={(e) => {
                    const { latitude, longitude } = e.nativeEvent.coordinate;
                    setLocation({ lat: latitude, lng: longitude });
                  }}
                />
              </MapView>

              <TouchableOpacity
                style={styles.locationBtn}
                onPress={handleUseMyLocation}
              >
                <Text style={styles.locationText}>📍 Gunakan Lokasi Saya</Text>
              </TouchableOpacity>

              <TextInput
                placeholder="Jenis Motor"
                style={styles.input}
                value={newMotor}
                onChangeText={setNewMotor}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#ef4444" }]}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.modalBtnText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#22c55e" }]}
                  onPress={handleAddOrder}
                >
                  <Text style={styles.modalBtnText}>Simpan</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function statusColor(status: string) {
  switch (status) {
    case "menunggu":
      return "#fbbf24";
    case "proses":
      return "#3b82f6";
    case "selesai":
      return "#22c55e";
    case "menginap":
      return "#a855f7";
    default:
      return "#9ca3af";
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight! / 2 : 5,
  },
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 5,
    backgroundColor: "#fff",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  refreshBtn: {
    backgroundColor: "#a3e635",
    padding: 10,
    borderRadius: 8,
  },
  refreshText: {
    fontWeight: "700",
    color: "#1f2937",
    fontSize: 16,
  },
  addBtn: {
    backgroundColor: "#22c55e",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  table: { borderWidth: 1, borderColor: "#e5e7eb", minWidth: 850 },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  headerRow: { backgroundColor: "#f3f4f6" },
  cell: { flex: 1, padding: 10, textAlign: "center", color: "#111" },
  headerCell: { fontWeight: "700", color: "#111" },
  statusButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  statusText: { color: "#fff", fontWeight: "700", textTransform: "capitalize" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    width: "90%",
    padding: 16,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 12,
    textAlign: "center",
  },
  map: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  locationBtn: {
    backgroundColor: "#a3e635",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  locationText: {
    color: "#1f2937",
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#f9fafb",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    marginHorizontal: 5,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalBtnText: { color: "#fff", fontWeight: "700" },
});
