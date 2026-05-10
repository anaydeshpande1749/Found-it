import { useEffect } from "react";
import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { View, Text, ActivityIndicator } from "react-native";

export default function Index() {
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/(tabs)" as any);
      } else {
        router.replace("/screens/login" as any);
      }
    });
    return unsub;
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#EFF6FF" }}>
      <Text style={{ fontSize: 40 }}>🔍</Text>
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#2563EB", marginTop: 10 }}>Foundit</Text>
      <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 20 }} />
    </View>
  );
}