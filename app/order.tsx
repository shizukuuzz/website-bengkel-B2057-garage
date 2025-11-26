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
import DateTimePicker from "@react-native-community/datetimepicker";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAuth } from "firebase/auth";
import { app } from "../lib/firebase";
import { supabase } from "../lib/supabase";

export default function UserOrderScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // FILTER STATE
  const [filterModal, setFilterModal] = useState(false);
  const [mode, setMode] = useState<"LIVE" | "MENGINAP">("LIVE");
  const [tempMode, setTempMode] = useState<"LIVE" | "MENGINAP">("LIVE");

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // ORDER MODAL
  const [showModal, setShowModal] = useState(false);
  const [newMotor, setNewMotor] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );

  const [region, setRegion] = useState({
    latitude: -7.5629,
    longitude: 110.8251,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // STATUS
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("menunggu");

  const allStatus = ["menunggu", "proses", "selesai", "menginap"];
  const auth = getAuth(app);

  /* ==========================================================
     FETCH ORDER SESUAI FILTER
  ========================================================== */
  useEffect(() => {
    fetchOrders();
  }, [mode, selectedDate]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let data: any[] = [];

      if (mode === "LIVE") {
        const start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(selectedDate);
        end.setHours(23, 59, 59, 999);

        const { data: liveData, error } = await supabase
          .from("orders")
          .select("id, motor, maps_link, status, order_time, finish_time")
          .neq("status", "menginap")
          .gte("order_time", start.toISOString())
          .lte("order_time", end.toISOString())
          .order("order_time", { ascending: false });

        if (error) throw error;
        data = liveData || [];
      } else {
        const { data: stayData, error } = await supabase
          .from("orders")
          .select("id, motor, maps_link, status, order_time, finish_time")
          .eq("status", "menginap")
          .order("order_time", { ascending: false });

        if (error) throw error;
        data = stayData || [];
      }

      setOrders(data);
    } catch {
      Alert.alert("Error", "Gagal memuat order.");
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     STATUS HANDLER
  ========================================================== */
  const openStatusModal = (id: string, status: string) => {
    setSelectedOrderId(id);
    setSelectedStatus(status);
    setShowStatusModal(true);
  };

  const updateStatus = async () => {
    if (!selectedOrderId) return;

    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: selectedStatus })
        .eq("id", selectedOrderId);

      if (error) throw error;

      setShowStatusModal(false);
      fetchOrders();
    } catch {
      Alert.alert("Error", "Gagal mengubah status");
    }
  };

  /* ==========================================================
     ORDER BARU
  ========================================================== */
  const handleUseMyLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted")
        return Alert.alert("Izin diperlukan", "Izinkan lokasi.");

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });

      setRegion({
        ...region,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch {
      Alert.alert("Error", "Tidak dapat mengambil lokasi.");
    }
  };

  const handleAddOrder = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (!newMotor.trim() || !location) {
      Alert.alert("Validasi", "Motor & lokasi wajib diisi!");
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
          order_time: new Date().toLocaleString("sv-SE").replace(" ", "T"),
        },
      ]);

      if (error) throw error;

      setShowModal(false);
      setNewMotor("");
      setLocation(null);
      fetchOrders();
    } catch {
      Alert.alert("Error", "Gagal membuat order.");
    }
  };

  /* ==========================================================
        FORMAT TANGGAL
  ========================================================== */
  const formattedDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const formatDate = (str: string | null) =>
    str
      ? new Date(str).toLocaleString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

  /* ==========================================================
        LOADING SCREEN
  ========================================================== */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#a3e635" />
        <Text style={{ marginTop: 10 }}>Memuat order...</Text>
      </View>
    );
  }

  /* ==========================================================
        MAIN UI
  ========================================================== */
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* ========== TOMBOL FILTER (FULL WIDTH) ========== */}
        <TouchableOpacity
          style={styles.bigFilterButton}
          onPress={() => {
            setTempMode(mode);
            setTempDate(selectedDate);
            setFilterModal(true);
          }}
        >
          <Text style={styles.bigFilterText}>FILTER</Text>
        </TouchableOpacity>

        {/* ========== TOMBOL ORDER BARU (FULL WIDTH) ========== */}
        <TouchableOpacity
          style={styles.bigAddButton}
          onPress={() => setShowModal(true)}
        >
          <Text style={styles.bigAddText}>+ Order Baru</Text>
        </TouchableOpacity>

        {/* ========== TABEL ORDER ========== */}
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
              ].map((t, i) => (
                <Text key={i} style={[styles.cell, styles.headerCell]}>
                  {t}
                </Text>
              ))}
            </View>

            {orders.length === 0 ? (
              <Text style={{ marginTop: 20, textAlign: "center" }}>
                Tidak ada data.
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
                    onPress={() => openStatusModal(order.id, order.status)}
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

        {/* ==========================================================
              FILTER MODAL (LIVE/MENGINAP + TANGGAL)
        ========================================================== */}
        <Modal visible={filterModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>

              <Text style={styles.modalTitle}>Filter Order</Text>

              {/* PILIH MODE */}
              <Text style={{ fontWeight: "700", marginBottom: 8 }}>Jenis Order:</Text>
              {["LIVE", "MENGINAP"].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.statusOption,
                    tempMode === m && styles.statusOptionActive,
                  ]}
                  onPress={() => setTempMode(m as "LIVE" | "MENGINAP")}
                >
                  <Text style={styles.statusOptionText}>{m}</Text>
                </TouchableOpacity>
              ))}

              {/* TANGGAL UNTUK MODE LIVE */}
              {tempMode === "LIVE" && (
                <>
                  <Text style={{ marginTop: 12, fontWeight: "700" }}>
                    Pilih Tanggal:
                  </Text>

                  <TouchableOpacity
                    style={styles.datePickBtn}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={{ fontWeight: "600" }}>
                      {formattedDate(tempDate)}
                    </Text>
                  </TouchableOpacity>

                  {showDatePicker && (
                    <DateTimePicker
                      value={tempDate}
                      mode="date"
                      display="calendar"
                      onChange={(e, d) => {
                        setShowDatePicker(false);
                        if (d) setTempDate(d);
                      }}
                    />
                  )}
                </>
              )}

              {/* BUTTON MODAL FILTER */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#ef4444" }]}
                  onPress={() => setFilterModal(false)}
                >
                  <Text style={styles.modalBtnText}>Batal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#22c55e" }]}
                  onPress={() => {
                    setMode(tempMode);
                    setSelectedDate(tempDate);
                    setFilterModal(false);
                  }}
                >
                  <Text style={styles.modalBtnText}>Terapkan</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </Modal>

        {/* ==========================================================
              STATUS MODAL
        ========================================================== */}
        <Modal visible={showStatusModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Ubah Status</Text>

              {allStatus.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.statusOption,
                    selectedStatus === s && styles.statusOptionActive,
                  ]}
                  onPress={() => setSelectedStatus(s)}
                >
                  <Text style={styles.statusOptionText}>{s}</Text>
                </TouchableOpacity>
              ))}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#ef4444" }]}
                  onPress={() => setShowStatusModal(false)}
                >
                  <Text style={styles.modalBtnText}>Batal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#22c55e" }]}
                  onPress={updateStatus}
                >
                  <Text style={styles.modalBtnText}>Simpan</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ==========================================================
              ORDER BARU MODAL
        ========================================================== */}
        <Modal visible={showModal} transparent animationType="slide">
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
                  coordinate={region}
                  onDragEnd={(e) =>
                    setLocation({
                      lat: e.nativeEvent.coordinate.latitude,
                      lng: e.nativeEvent.coordinate.longitude,
                    })
                  }
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

/* ==========================================================
   WARNA STATUS
========================================================== */
function statusColor(status: string) {
  switch (status) {
    case "menunggu": return "#fbbf24";
    case "proses": return "#3b82f6";
    case "selesai": return "#22c55e";
    case "menginap": return "#a855f7";
    default: return "#9ca3af";
  }
}

/* ==========================================================
   STYLES
========================================================== */
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
  },

  /* ==== FULL WIDTH FILTER BUTTON ==== */
  bigFilterButton: {
    backgroundColor: "#a3e635",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 12,
  },
  bigFilterText: {
    color: "#1f2937",
    fontSize: 16,
    fontWeight: "700",
  },

  /* ==== FULL WIDTH ADD BUTTON ==== */
  bigAddButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    width: "100%",
  },

  bigAddText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  /* ==== TABLE ==== */
  table: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    minWidth: 850,
  },

  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },

  headerRow: {
    backgroundColor: "#f3f4f6",
  },

  cell: {
    flex: 1,
    padding: 10,
    textAlign: "center",
    color: "#111",
  },

  headerCell: {
    fontWeight: "700",
    color: "#111",
  },

  /* ==== STATUS BUTTON ==== */
  statusButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },

  statusText: {
    color: "#fff",
    fontWeight: "700",
    textTransform: "capitalize",
  },

  /* ==== MODALS ==== */

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
    marginBottom: 12,
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
    backgroundColor: "#f9fafb",
    marginBottom: 12,
  },

  modalButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  modalBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  modalBtnText: {
    color: "#fff",
    fontWeight: "700",
  },

  statusOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    marginVertical: 5,
  },

  statusOptionActive: {
    backgroundColor: "#a3e635",
    borderColor: "#84cc16",
  },

  statusOptionText: {
    fontWeight: "600",
    textAlign: "center",
    textTransform: "capitalize",
  },

  datePickBtn: {
    backgroundColor: "#e5e7eb",
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
    alignItems: "center",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
