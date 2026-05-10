import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';

export default function ChatListScreen() {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    // In a real app, we'd have a 'user_chats' collection to avoid querying all chats
    // For now, we listen to the 'chats' collection where messages exist
    const q = query(
      collection(db, 'chats'),
      // Ideally filtered by user participation, but current ID structure is [uid1]_[uid2]_[itemId]
      orderBy('lastMessageAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const chatData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((chat: any) => chat.id.includes(user.uid));
      
      setChats(chatData);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  const handleDeleteChat = (chatId: string, itemName: string) => {
    Alert.alert(
      "Delete Conversation",
      `Are you sure you want to delete your chat for "${itemName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "chats", chatId));
            } catch (error: any) {
              Alert.alert("Error", "Could not delete the conversation.");
            }
          }
        }
      ]
    );
  };

  const renderChatItem = ({ item }: { item: any }) => {
    const parts = item.id.split('_');
    const itemId = parts[2];
    const otherUserId = parts[0] === user?.uid ? parts[1] : parts[0];

    return (
      <View style={styles.chatCardContainer}>
        <TouchableOpacity 
          style={styles.chatCard}
          onPress={() => router.push({
            pathname: "/screens/chat",
            params: { 
              itemId: itemId, 
              itemName: item.itemName || "Item", 
              ownerId: otherUserId 
            }
          })}
        >
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color="#2563EB" />
          </View>
          <View style={styles.chatInfo}>
            <Text style={styles.itemName}>{item.itemName || "Unknown Item"}</Text>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage || "Click to view messages"}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => handleDeleteChat(item.id, item.itemName || "Unknown Item")}
            style={styles.deleteBtn}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Conversations</Text>
      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No active chats yet</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { fontSize: 24, fontWeight: 'bold', padding: 20, color: '#1F2937', backgroundColor: 'white' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 15 },
  chatCardContainer: { 
    backgroundColor: 'white', 
    borderRadius: 12, 
    marginBottom: 10,
    elevation: 2 
  },
  chatCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
  },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  chatInfo: { flex: 1, marginLeft: 15 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  lastMessage: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  deleteBtn: { padding: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: '#9CA3AF', marginTop: 10 },
});