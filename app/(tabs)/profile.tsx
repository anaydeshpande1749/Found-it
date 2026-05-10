import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth, db } from "../../firebaseConfig";

export default function ProfileScreen() {
  const [myItems, setMyItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "items"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyItems(data);
    });
    return unsub;
  }, []);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout", style: "destructive", onPress: async () => {
          await signOut(auth);
          router.replace("/screens/login");
        }
      }
    ]);
  };

  const filtered = myItems.filter(item => filter === "all" || item.type === filter);
  const lostCount = myItems.filter(i => i.type === "lost").length;
  const foundCount = myItems.filter(i => i.type === "found").length;

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.badge, item.type === "lost" ? styles.lostBadge : styles.foundBadge]}>
          <Text style={styles.badgeText}>{item.type === "lost" ? "Lost" : "Found"}</Text>
        </View>
        <Text style={[styles.status, item.status === "open" ? styles.statusOpen : styles.statusClosed]}>
          {item.status === "open" ? "Active" : "Resolved"}
        </Text>
      </View>
      <Text style={styles.itemName}>{item.itemName}</Text>
      <Text style={styles.itemLocation}>{item.location}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.username}>{user?.displayName || "User"}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{lostCount}</Text>
            <Text style={styles.statLabel}>Lost</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{foundCount}</Text>
            <Text style={styles.statLabel}>Found</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{myItems.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </View>
      <View style={styles.filters}>
        {["all", "lost", "found"].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No items yet</Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  header: { backgroundColor: "#2563EB", padding: 20, paddingTop: 50, alignItems: "center" },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: "white", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  avatarText: { fontSize: 30, fontWeight: "bold", color: "#2563EB" },
  username: { color: "white", fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  email: { color: "white", fontSize: 14, marginBottom: 20, opacity: 0.9 },
  statsRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 16, padding: 15, width: "100%", justifyContent: "space-around" },
  stat: { alignItems: "center" },
  statNumber: { fontSize: 24, fontWeight: "bold", color: "white" },
  statLabel: { fontSize: 12, color: "#BFDBFE", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.3)" },
  filters: { flexDirection: "row", padding: 15, gap: 10 },
  filterBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: "white", borderWidth: 1, borderColor: "#E5E7EB" },
  filterActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  filterText: { color: "#6B7280", fontWeight: "600" },
  filterTextActive: { color: "white" },
  card: { backgroundColor: "white", marginHorizontal: 15, marginBottom: 12, borderRadius: 16, padding: 15, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  lostBadge: { backgroundColor: "#FEE2E2" },
  foundBadge: { backgroundColor: "#D1FAE5" },
  badgeText: { fontSize: 12, fontWeight: "600" },
  status: { fontSize: 12, fontWeight: "600", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusOpen: { backgroundColor: "#DBEAFE", color: "#2563EB" },
  statusClosed: { backgroundColor: "#F3F4F6", color: "#6B7280" },
  itemName: { fontSize: 16, fontWeight: "bold", color: "#1F2937", marginBottom: 5 },
  itemLocation: { color: "#6B7280", fontSize: 13 },
  empty: { alignItems: "center", marginTop: 50 },
  emptyText: { fontSize: 18, color: "#6B7280" },
  logoutBtn: { margin: 15, backgroundColor: "white", borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#FEE2E2" },
  logoutText: { color: "#DC2626", fontSize: 16, fontWeight: "600" },
});