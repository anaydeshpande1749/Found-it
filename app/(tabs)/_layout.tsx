import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { auth, db } from '../../firebaseConfig';

export default function TabLayout() {
  const [unreadCount, setUnreadCount] = useState(0);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'chats'));
    const unsub = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (
          data.participants?.includes(user.uid) && 
          data.hasUnread && 
          data.lastSenderId !== user.uid // someone else sent the last message
        ) {
          count++;
        }
      });
      setUnreadCount(count);
    });
    return unsub;
  }, [user]);

  return (
    <Tabs screenOptions={({ route }) => ({
      tabBarActiveTintColor: '#2563EB',
      tabBarInactiveTintColor: 'gray',
      tabBarStyle: { paddingBottom: 5, height: 60 },
      tabBarIcon: ({ color, size }: any) => {
        let iconName: any;
        if (route.name === 'index') iconName = 'home';
        else if (route.name === 'reportlost') iconName = 'alert-circle';
        else if (route.name === 'reportfound') iconName = 'checkmark-circle';
        else if (route.name === 'chats') iconName = 'chatbubbles';
        else if (route.name === 'profile') iconName = 'person';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="reportlost" options={{ title: 'Lost' }} />
      <Tabs.Screen name="reportfound" options={{ title: 'Found' }} />
      <Tabs.Screen 
        name="chats" 
        options={{ 
          title: 'Chats',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: 'red', color: 'white' }
        }} 
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
