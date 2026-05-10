import { router } from "expo-router";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth } from "../../firebaseConfig";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    const regex = /^\d{3}[a-zA-Z]+\d{4}@dbit\.in$/;
    return regex.test(email);
  };

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !username)) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert(
        "Invalid Email",
        "Please use your college email (e.g., 442john0035@dbit.in)"
      );
      return;
    }

    try {
      setLoading(true);
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: username
        });
      }
      router.replace("/(tabs)" as any);
    } catch (error: any) {
      console.log("AUTH ERROR:", error.code, error.message);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>🔍</Text>
        <Text style={styles.appName}>Foundit</Text>
        <Text style={styles.tagline}>Find what is lost on campus</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{isLogin ? "Welcome Back!" : "Create Account"}</Text>

        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="words"
            placeholderTextColor="#9CA3AF"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="College Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#9CA3AF"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#9CA3AF"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>{isLogin ? "Login" : "Sign Up"}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EFF6FF", justifyContent: "center", padding: 20 },
  logoContainer: { alignItems: "center", marginBottom: 30 },
  logo: { fontSize: 60 },
  appName: { fontSize: 36, fontWeight: "bold", color: "#2563EB", marginTop: 10 },
  tagline: { fontSize: 14, color: "#6B7280", marginTop: 5 },
  card: { backgroundColor: "white", borderRadius: 20, padding: 25, elevation: 5 },
  title: { fontSize: 22, fontWeight: "bold", color: "#1F2937", marginBottom: 20, textAlign: "center" },
  input: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 15, marginBottom: 15, fontSize: 16, color: "#1F2937" },
  button: { backgroundColor: "#2563EB", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 5 },
  buttonDisabled: { backgroundColor: "#9CA3AF" },
  buttonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  switchText: { color: "#2563EB", textAlign: "center", marginTop: 15, fontSize: 14 },
});