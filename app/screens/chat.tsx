import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';

export default function ChatScreen() {
  const { itemId, itemName, ownerId } = useLocalSearchParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [showOptions, setShowOptions] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);
  const user = auth.currentUser;

  // chatId = [uid1, uid2].sort().join('_') + '_' + itemId
  const uids = [user?.uid, ownerId].sort();
  const chatId = `${uids[0]}_${uids[1]}_${itemId}`;

  useEffect(() => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(data);
    });

    // Mark as read when entering the chat if this user didn't send the last message
    const markRead = async () => {
      if (chatId) {
        await updateDoc(doc(db, 'chats', chatId), { hasUnread: false }).catch(() => {});
      }
    };
    markRead();

    return unsub;
  }, [chatId]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    const textSnippet = message.trim();
    
    try {
      if (editingMessage) {
        // Handle Update
        await updateDoc(doc(db, 'chats', chatId, 'messages', editingMessage.id), {
          text: textSnippet,
          isEdited: true,
          updatedAt: serverTimestamp()
        });
        setEditingMessage(null);
      } else {
        // Handle New Message
        await setDoc(doc(db, 'chats', chatId), {
          lastMessage: textSnippet,
          lastMessageAt: serverTimestamp(),
          itemName: itemName,
          participants: [user?.uid, ownerId],
          updatedAt: serverTimestamp(),
          hasUnread: true,
          lastSenderId: user?.uid
        }, { merge: true });

        await addDoc(collection(db, 'chats', chatId, 'messages'), {
          text: textSnippet,
          senderId: user?.uid,
          senderEmail: user?.email,
          senderName: user?.displayName,
          createdAt: serverTimestamp(),
        });
      }
      setMessage('');
      flatListRef.current?.scrollToEnd();
    } catch (error: any) {
      console.log("CHAT ERROR:", error.message);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    Alert.alert("Delete Message", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          await deleteDoc(doc(db, 'chats', chatId, 'messages', msgId));
          setShowOptions(null);
        }
      }
    ]);
  };

  const handleEditInit = (msg: any) => {
    setEditingMessage(msg);
    setMessage(msg.text);
    setShowOptions(null);
  };

  const renderMessage = ({ item }: any) => {
    const isMe = item.senderId === user?.uid;
    return (
      <View style={[styles.messageRow, isMe ? styles.myRow : styles.theirRow]}>
        {!isMe && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.senderName ? item.senderName.charAt(0).toUpperCase() : item.senderEmail?.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <TouchableOpacity 
          activeOpacity={0.8}
          onLongPress={() => isMe && setShowOptions(item)}
          style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}
        >
          <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            {item.isEdited && <Text style={[styles.editedText, isMe ? styles.myTime : styles.theirTime]}>Edited • </Text>}
            <Text style={[styles.timeText, isMe ? styles.myTime : styles.theirTime]}>
              {item.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Action Modal for Long Press */}
        <Modal
          transparent
          visible={showOptions?.id === item.id}
          animationType="fade"
          onRequestClose={() => setShowOptions(null)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setShowOptions(null)}
          >
            <View style={styles.optionsCard}>
              <TouchableOpacity style={styles.optionItem} onPress={() => handleEditInit(item)}>
                <Ionicons name="pencil" size={20} color="#1F2937" />
                <Text style={styles.optionText}>Edit Message</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.optionItem, styles.deleteOption]} onPress={() => handleDeleteMessage(item.id)}>
                <Ionicons name="trash" size={20} color="#EF4444" />
                <Text style={[styles.optionText, styles.deleteText]}>Delete Message</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.chatHeader}>
        <Text style={styles.chatTitle}>💬 {itemName}</Text>
        <Text style={styles.chatSub}>Chat about this item</Text>
        {editingMessage && (
          <TouchableOpacity onPress={() => { setEditingMessage(null); setMessage(''); }} style={styles.cancelEdit}>
            <Text style={styles.cancelEditText}>Cancel Editing</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubText}>Start the conversation! 👋</Text>
          </View>
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={editingMessage ? "Edit message..." : "Type a message..."}
          value={message}
          onChangeText={setMessage}
          placeholderTextColor="#9CA3AF"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!message.trim()}
        >
          <Text style={styles.sendText}>{editingMessage ? "✓" : "➤"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  chatHeader: {
    backgroundColor: '#2563EB',
    padding: 15,
    paddingTop: 20,
  },
  chatTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  chatSub: { fontSize: 12, color: '#BFDBFE', marginTop: 2 },
  messagesList: { padding: 15, paddingBottom: 10 },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  myRow: { justifyContent: 'flex-end' },
  theirRow: { justifyContent: 'flex-start' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    padding: 12,
    elevation: 1,
  },
  myBubble: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: 15 },
  myText: { color: 'white' },
  theirText: { color: '#1F2937' },
  timeText: { fontSize: 10, marginTop: 4 },
  myTime: { color: '#BFDBFE', textAlign: 'right' },
  theirTime: { color: '#9CA3AF' },
  messageFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  editedText: { fontSize: 10, color: '#BFDBFE' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  optionsCard: { backgroundColor: 'white', width: '80%', borderRadius: 12, padding: 8 },
  optionItem: { flexDirection: 'row', alignItems: 'center', padding: 15, gap: 12 },
  optionText: { fontSize: 16, color: '#1F2937' },
  deleteOption: { borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  deleteText: { color: '#EF4444' },
  cancelEdit: { marginTop: 5, alignSelf: 'flex-end' },
  cancelEditText: { color: '#BFDBFE', fontSize: 12, fontWeight: 'bold' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, color: '#6B7280', fontWeight: 'bold' },
  emptySubText: { fontSize: 14, color: '#9CA3AF', marginTop: 5 },
  inputRow: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1F2937',
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#2563EB',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#9CA3AF' },
  sendText: { color: 'white', fontSize: 18 },
});
