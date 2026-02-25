import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../context/authContext';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { chatService } from '../../../services/chatService';
import { createGlobalStyles } from '../../theme/styles';

type ChatPreview = {
  ChatDoctorId: string;
  ChatId: string;
  ChatDoctorName: string;
  ChatDoctorSpecialization: string;
  ChatPatientSpecialization: string;
  ChatTimestamp: string;
  ChatUnreadCount: number;
  ChatLastMessage: string;
  ChatLastMessageRead: boolean;
};

const ChatScreen = () => {
  const { colors } = useColorScheme();
  const globalStyles = createGlobalStyles(colors);
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const { currentUser } = useAuth();

  const getToken = async () => {
    const token = await AsyncStorage.getItem('token');
    return token;
  }

  useEffect(() => {
    const initializeChat = async () => {
    const token = await getToken();
    if (token) {
      // Initialize chat service with user's token
      chatService.initialize(token);
        // Fetch chats once when user is available
      fetchChats();
      console.log('New message:', chats);
      // Listen for new messages
      const unsubscribeNewMessage = chatService.onNewMessage((message) => {
        setChats(prevChats => {
          const updatedChats = [...prevChats];
          const chatIndex = updatedChats.findIndex(c => c.ChatId === message.MessageChatId.toString());
          
          if (chatIndex !== -1) {
            updatedChats[chatIndex] = {
              ...updatedChats[chatIndex],
              ChatLastMessage: message.MessageContent,
              ChatTimestamp: new Date(message.MessageSentAt).toLocaleTimeString(),
              ChatUnreadCount: updatedChats[chatIndex].ChatUnreadCount + 1
            };
          }
          
          return updatedChats;
        });
      });
    


      // Listen for typing status
      const unsubscribeTyping = chatService.onTypingStatus((data) => {
        // Handle typing status updates
        console.log('Typing status:', data);
      });

      // Listen for read receipts
      const unsubscribeReadReceipt = chatService.onReadReceipt((data) => {
        setChats(prevChats => {
          const updatedChats = [...prevChats];
          const chatIndex = updatedChats.findIndex(c => c.ChatId === data.userId);
          
          if (chatIndex !== -1) {
            updatedChats[chatIndex] = {
              ...updatedChats[chatIndex],
              ChatUnreadCount: 0
            };
          }
          
          return updatedChats;
        });
      });

      // Cleanup on unmount
      return () => {
        unsubscribeNewMessage();
        unsubscribeTyping();
        unsubscribeReadReceipt();
        chatService.disconnect();
      };
    }
    }
    initializeChat();
  }, [currentUser]);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const response = await chatService.getDoctors();
      console.log('Response:', response.data);
      const chats = response.data.chats.map((chat: any) => ({
        ChatDoctorId: chat.AppointmentDoctorId,
        ChatId: chat.ChatId,
        ChatDoctorName: chat.doctorName,
        ChatDoctorSpecialization: chat.doctorSpecialization,
        ChatPatientSpecialization: chat.AppointmentPatientId,
        ChatTimestamp: chat.ChatTimestamp,
        ChatUnreadCount: chat.unreadCount,
        ChatLastMessageRead: chat.MessageRead || false,
        ChatLastMessage: chat.ChatLastMessage || 'No messages yet',
      }));
      console.log('Chats:', chats);
      setChats(chats);  
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.ChatDoctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.ChatDoctorSpecialization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderChatItem = ({ item }: { item: ChatPreview }) => (
    <TouchableOpacity
      style={[styles.chatItem, { backgroundColor: colors.background }]}
      onPress={() => {
        // Mark messages as read when opening chat
        chatService.markMessagesAsRead(item.ChatId);
        router.push(`/patient/chat/${item.ChatId}`);
      }}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: colors.patientPrimary + '20' }]}>
          <ThemedText style={[styles.avatarText, { color: colors.patientPrimary }]}>
            {item.ChatDoctorName.charAt(0)}
          </ThemedText>
        </View>
        {/* {item.ChatLastMessageRead && (
          <View style={[styles.onlineIndicator, { backgroundColor: '#4CAF50', borderColor: colors.background }]} />
        )} */}
        {item.ChatUnreadCount > 0 && !item.ChatLastMessageRead && (
          <View style={[styles.unreadBadge, { backgroundColor: colors.patientPrimary }]}>
            <ThemedText style={[styles.unreadCount, { color: colors.background }]}>
              {item.ChatUnreadCount}
            </ThemedText>
          </View>
        )}
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <View style={styles.nameContainer}>
            <ThemedText style={[styles.doctorName, { color: colors.text }]}>
              {item.ChatDoctorName} | {item.ChatDoctorSpecialization}
            </ThemedText>
          </View>
          <ThemedText style={[styles.timestamp, { color: colors.textLight }]}>
            {item.ChatTimestamp}
          </ThemedText>
        </View>
        <View style={styles.lastMessageContainer}>
          <ThemedText 
            style={[
              styles.lastMessage, 
              { 
                color: item.ChatUnreadCount > 0 ? colors.text : colors.textLight,
                flex: 1,
                marginRight: 8
              }
            ]}
            numberOfLines={1}
          >
            {item.ChatLastMessage}
          </ThemedText>
          {/* <View style={styles.tickContainer}>
            <Ionicons 
              name={item.ChatLastMessageRead ? "checkmark-done" : "checkmark"} 
              size={12} 
              color={colors.patientPrimary} 
            />
          </View> */}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[globalStyles.container, styles.container]}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[colors.patientPrimary, colors.patientPrimary + 'CC']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.background} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: colors.background }]}>
            Messages
          </ThemedText>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.background }]}>
          <Ionicons name="search" size={20} color={colors.textLight} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search doctors..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={item => item.ChatId}
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40,
  },
  searchContainer: {
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  chatList: {
    padding: 16,
  },
  chatItem: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  avatarContainer: {
    marginRight: 12,
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    top: -5,
    right: -5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  specialization: {
    fontSize: 12,
  },
  timestamp: {
    fontSize: 12,
  },
  lastMessage: {
    fontSize: 14,
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  tickContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 16,
  },
}); 