import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { View, Text, ActivityIndicator } from "react-native";

export default function RootLayout() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser as any);
      setChecking(false);
    }, (error) => {
      console.log("Auth error:", error);
      setChecking(false);
    });

    const timeout = setTimeout(() => {
      setChecking(false);
    }, 8000);

    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#EFF6FF" }}>
        <Text style={{ fontSize: 40 }}>🔍</Text>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#2563EB", marginTop: 10 }}>Foundit</Text>
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 20 }} />
        <Text style={{ color: "#6B7280", marginTop: 10 }}>Connecting...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="screens/login" options={{ headerShown: false }} />
        <Stack.Screen name="screens/chat" options={{ title: "Chat" }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}