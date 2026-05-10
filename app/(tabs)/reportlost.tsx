import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image, ActivityIndicator } from "react-native";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { db, auth } from "../../firebaseConfig";
import { router } from "expo-router";

export default function ReportLostScreen() {
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert("Permission needed", "Please allow access to your photos"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({

      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.3,
    });
    if (!result.canceled) { setImage(result.assets[0].uri); }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { Alert.alert("Permission needed", "Please allow access to your camera"); return; }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.3,
    });
    if (!result.canceled) { setImage(result.assets[0].uri); }
  };

  const handleSubmit = async () => {
    if (!itemName || !description || !location) { Alert.alert("Error", "Please fill in all fields"); return; }
    try {
      setLoading(true);
      let imageBase64 = null;
      if (image) {
        imageBase64 = await FileSystem.readAsStringAsync(image, { encoding: "base64" });
        imageBase64 = "data:image/jpeg;base64," + imageBase64;
      }
      await addDoc(collection(db, "items"), {
        type: "lost",
        itemName,
        description,
        location,
        imageUrl: imageBase64,
        userId: auth.currentUser?.uid,
        userEmail: auth.currentUser?.email,
        status: "open",
        createdAt: serverTimestamp(),
      });
      Alert.alert("Success!", "Your lost item has been reported!");
      setItemName(""); setDescription(""); setLocation(""); setImage(null);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Report Lost Item</Text>
        <Text style={styles.headerSub}>Fill in details about your lost item</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Item Name *</Text>
        <TextInput style={styles.input} placeholder="e.g. Black Wallet..." value={itemName} onChangeText={setItemName} placeholderTextColor="#9CA3AF" />
        <Text style={styles.label}>Description *</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Describe your item..." value={description} onChangeText={setDescription} multiline numberOfLines={4} placeholderTextColor="#9CA3AF" />
        <Text style={styles.label}>Last Seen Location *</Text>
        <TextInput style={styles.input} placeholder="e.g. Library, Canteen..." value={location} onChangeText={setLocation} placeholderTextColor="#9CA3AF" />
        <Text style={styles.label}>Photo (Optional)</Text>
        {image ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.previewImage} />
            <TouchableOpacity style={styles.removeBtn} onPress={() => setImage(null)}>
              <Text style={styles.removeBtnText}>Remove Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
              <Text style={styles.photoBtnIcon}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
              <Text style={styles.photoBtnIcon}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Report Lost Item</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  header: { backgroundColor: "#DC2626", padding: 20, paddingTop: 50 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "white" },
  headerSub: { fontSize: 14, color: "#FECACA", marginTop: 2 },
  form: { padding: 20 },
  label: { fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 8, marginTop: 5 },
  input: { backgroundColor: "white", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 14, fontSize: 16, color: "#1F2937", marginBottom: 15 },
  textArea: { height: 100, textAlignVertical: "top" },
  photoButtons: { flexDirection: "row", gap: 10, marginBottom: 15 },
  photoBtn: { flex: 1, backgroundColor: "white", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 15, alignItems: "center" },
  photoBtnIcon: { color: "#2563EB", fontWeight: "bold", fontSize: 16 },
  imageContainer: { marginBottom: 15 },
  previewImage: { width: "100%", height: 200, borderRadius: 12, marginBottom: 8 },
  removeBtn: { backgroundColor: "#FEE2E2", borderRadius: 8, padding: 10, alignItems: "center" },
  removeBtnText: { color: "#DC2626", fontWeight: "600" },
  button: { backgroundColor: "#DC2626", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 10 },
  buttonDisabled: { backgroundColor: "#9CA3AF" },
  buttonText: { color: "white", fontSize: 18, fontWeight: "bold" },
});
