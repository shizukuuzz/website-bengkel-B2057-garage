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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

export default function AdminAntrianScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mode, setMode] = useState<"LIVE" | "MENGINAP">("LIVE");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const nextStatus: Record<string, string> = {
    menunggu: "proses",
    proses: "selesai",
    selesai: "menginap",
    menginap: "menunggu",
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedDate, mode]);

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
          .select(`
            id, motor, maps_link, status, order_time,
            users(full_name, phone)
          `)
          .neq("status", "menginap")
          .gte("order_time", start.toISOString())
          .lte("order_time", end.toISOString())
          .order("order_time", { ascending: true });

        if (error) throw error;
        data = liveData || [];
      } else {
        const { data: stayData, error } = await supabase
          .from("orders")
          .select(`
            id, motor, maps_link, status, order_time,
            users(full_name, phone)
          `)
          .eq("status", "menginap")
          .order("order_time", { ascending: true });

        if (error) throw error;
        data = stayData || [];
      }
      setOrders(data);
    } catch (err: any) {
      console.error("Gagal memuat antrian:", err.message);
      Alert.alert("Error", "Gagal memuat data antrian");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, currentStatus: string) => {
    try {
      const newStatus = nextStatus[currentStatus] || "menunggu";
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      fetchOrders();
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", "Gagal mengubah status");
    }
  };

  const formattedDate = (date: Date) =>
    date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#a3e635" />
        <Text style={{ marginTop: 10 }}>Memuat antrian...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* FILTER BAR */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => {
              if (mode === "LIVE") setShowDatePicker(true);
            }}
            style={[
              styles.filterButton,
              mode === "MENGINAP" && { backgroundColor: "#e5e7eb" },
            ]}
          >
            <Text style={styles.filterText}>
              📅 {formattedDate(selectedDate)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() =>
              setMode((prev) => (prev === "LIVE" ? "MENGINAP" : "LIVE"))
            }
          >
            <Text style={styles.filterText}>
              ⚙️ Jenis: {mode === "LIVE" ? "LIVE" : "MENGINAP"}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="calendar"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setSelectedDate(date);
            }}
          />
        )}

        {/* TABEL ANTRIAN */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            {/* HEADER */}
            <View style={[styles.row, styles.headerRow]}>
              {[
                "No",
                "Motor",
                "Nama",
                "Nomor",
                "Lokasi",
                "Status",
                "Nota",
                "Chat",
              ].map((h, i) => (
                <Text key={i} style={[styles.cell, styles.headerCell]}>
                  {h}
                </Text>
              ))}
            </View>

            {/* ISI TABEL */}
            {orders.length === 0 ? (
              <Text style={{ marginTop: 20, textAlign: "center" }}>
                Tidak ada antrian untuk{" "}
                {mode === "LIVE" ? "hari ini" : "menginap"}.
              </Text>
            ) : (
              orders.map((order, index) => (
                <View key={order.id} style={styles.row}>
                  <Text style={styles.cell}>{index + 1}</Text>
                  <Text style={styles.cell}>{order.motor}</Text>
                  <Text style={styles.cell}>{order.users?.full_name}</Text>
                  <Text style={styles.cell}>{order.users?.phone}</Text>

                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(
                        `https://maps.google.com/?q=${order.maps_link}`
                      )
                    }
                  >
                    <Text style={[styles.cell, { color: "#3b82f6" }]}>Lihat</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      { backgroundColor: statusColor(order.status) },
                    ]}
                    onPress={() =>
                      handleStatusChange(order.id, order.status)
                    }
                  >
                    <Text style={styles.statusText}>{order.status}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert("Nota", "Fitur nota akan segera tersedia.")
                    }
                  >
                    <Text style={[styles.cell, { color: "#a855f7" }]}>Nota</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert("Chat", "Fitur chat akan segera tersedia.")
                    }
                  >
                    <Text style={[styles.cell, { color: "#10b981" }]}>Chat</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 4,
  },
  filterButton: {
    backgroundColor: "#a3e635",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  filterText: { color: "#1f2937", fontWeight: "600" },
  table: { borderWidth: 1, borderColor: "#e5e7eb", minWidth: 700 },
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
});
