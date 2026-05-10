import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth, db } from "../../firebaseConfig";

export default function HomeScreen() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const user = auth.currentUser;

  useEffect(() => {
    const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      
      const data = snapshot.docs.map(docSnapshot => {
        const d = docSnapshot.data();
        
        // 3. Remove reports older than 30 days automatically
        if (d.createdAt) {
          const itemTime = d.createdAt.toMillis();
          if (now - itemTime > thirtyDaysMs) {
            deleteDoc(doc(db, "items", docSnapshot.id)).catch(console.log);
            return null; // Will be filtered out
          }
        }
        
        return { id: docSnapshot.id, ...d };
      }).filter(Boolean);

      setItems(data as any);
    });
    return unsub;
  }, []);

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    Alert.alert(
      "Delete Report",
      `Are you sure you want to delete "${itemName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "items", itemId));
            } catch (error: any) {
              Alert.alert("Error", "Could not delete the item.");
            }
          }
        }
      ]
    );
  };

  const filtered = items.filter(item => {
    const matchSearch = item.itemName?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || item.type === filter;
    return matchSearch && matchFilter;
  });

  const renderItem = ({ item }) => {
    const isOwner = item.userId === user?.uid;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => isOwner ? 
          Alert.alert("Your Item", "You posted this item. Please check your Chats tab at the bottom to see messages from other users.") : 
          router.push({ pathname: "/screens/chat", params: { itemId: item.id, itemName: item.itemName, ownerId: item.userId } })}
      >
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
        )}
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <View style={[styles.badge, item.type === "lost" ? styles.lostBadge : styles.foundBadge]}>
              <Text style={styles.badgeText}>{item.type === "lost" ? "Lost" : "Found"}</Text>
            </View>
            <Text style={styles.date}>{item.createdAt?.toDate().toLocaleDateString()}</Text>
          </View>
          <Text style={styles.itemName}>{item.itemName}</Text>
          <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.location}>{item.location}</Text>
            <View style={styles.actions}>
              {isOwner && (
                <TouchableOpacity 
                  onPress={() => handleDeleteItem(item.id, item.itemName)}
                  style={styles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
              <Text style={styles.chatBtn}>Chat</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Foundit</Text>
        <Text style={styles.headerSub}>Campus Lost and Found</Text>
      </View>
      <TextInput
        style={styles.search}
        placeholder="Search items..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#9CA3AF"
      />
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
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No items found</Text>
            <Text style={styles.emptySubText}>Report a lost or found item!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  header: { backgroundColor: "#2563EB", padding: 20, paddingTop: 50 },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "white" },
  headerSub: { fontSize: 14, color: "#BFDBFE", marginTop: 2 },
  search: { backgroundColor: "white", margin: 15, borderRadius: 12, padding: 12, fontSize: 16, borderWidth: 1, borderColor: "#E5E7EB", color: "#1F2937" },
  filters: { flexDirection: "row", paddingHorizontal: 15, marginBottom: 10, gap: 10 },
  filterBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: "white", borderWidth: 1, borderColor: "#E5E7EB" },
  filterActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  filterText: { color: "#6B7280", fontWeight: "600" },
  filterTextActive: { color: "white" },
  card: { backgroundColor: "white", marginHorizontal: 15, marginBottom: 12, borderRadius: 16, overflow: "hidden", elevation: 2 },
  itemImage: { width: "100%", height: 180 },
  cardBody: { padding: 15 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  lostBadge: { backgroundColor: "#FEE2E2" },
  foundBadge: { backgroundColor: "#D1FAE5" },
  badgeText: { fontSize: 12, fontWeight: "600" },
  date: { color: "#9CA3AF", fontSize: 12 },
  itemName: { fontSize: 18, fontWeight: "bold", color: "#1F2937", marginBottom: 5 },
  itemDesc: { color: "#6B7280", fontSize: 14, marginBottom: 10, width: "60%" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  location: { color: "#6B7280", fontSize: 13, width: "60%" },
  actions: { flexDirection: "row", alignItems: "center", gap: 15 },
  deleteBtn: { padding: 4 },
  chatBtn: { color: "#2563EB", fontWeight: "600", fontSize: 14 },
  empty: { alignItems: "center", marginTop: 80 },
  emptyText: { fontSize: 20, color: "#6B7280", fontWeight: "bold" },
  emptySubText: { fontSize: 14, color: "#9CA3AF", marginTop: 5 },
});