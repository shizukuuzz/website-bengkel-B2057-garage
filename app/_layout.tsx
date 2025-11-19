import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Semua halaman otomatis diatur oleh expo-router */}
    </Stack>
  );
}
