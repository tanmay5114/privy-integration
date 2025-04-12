import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import COLORS from '../assets/colors';
import { fetchChats } from '@/lib/utils';
import { useWallet } from '@/walletProviders';

const { width, height } = Dimensions.get('window');

// Define chat history item interface
interface ChatHistoryItem {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export default function ChatHistoryScreen() {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const [chats, setChats] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { connected, address, publicKey } = useWallet();
  const walletAddress = address || publicKey?.toString();
  
  useEffect(() => {
    async function loadChats() {
      if (!connected || !walletAddress) {
        setError("Wallet not connected");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        const fetchedChats = await fetchChats(10, null, null, walletAddress);
        
        if (fetchedChats.length === 0) {
          setChats([]);
        } else {
          setChats(fetchedChats);
        }
      } catch (err) {
        console.error('Error loading chats:', err);
        setError('Failed to load chat history');
      } finally {
        setLoading(false);
      }
    }
    
    loadChats();
  }, [connected, walletAddress]);

  const formatTime = (date: string): string => {
    const now = new Date();
    const chatDate = new Date(date);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Same day - show time
    if (chatDate >= today) {
      return chatDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // Yesterday - show "Yesterday"
    else if (chatDate >= yesterday) {
      return 'Yesterday';
    }
    // Older - show date
    else {
      return chatDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const navigateToChat = (chatId: string) => {
    navigation.navigate('Chat', { id: chatId });
  };
  
  const getInitial = (title: string) => {
    return title.charAt(0).toUpperCase();
  };

  const renderChatItem = ({ item }: { item: ChatHistoryItem }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => navigateToChat(item.id)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['#2A2A2A', '#303030']}
        style={styles.chatItemGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.chatItemContent}>
          <View style={styles.chatItemAvatar}>
            <Text style={styles.chatItemAvatarText}>
              {getInitial(item.title)}
            </Text>
          </View>
          
          <View style={styles.chatItemDetails}>
            <View style={styles.chatItemHeader}>
              <Text style={styles.chatItemTitle}>{item.title}</Text>
              <Text style={styles.chatItemTime}>{formatTime(item.updatedAt || item.createdAt)}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.brandPrimary} />
          <Text style={styles.loadingText}>Loading chats...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          {!connected && (
            <TouchableOpacity style={styles.connectButton}>
              <Text style={styles.connectButtonText}>Connect Wallet</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    
    if (chats.length === 0) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>No chats found</Text>
          <TouchableOpacity 
            style={styles.startChatButton}
            onPress={() => navigation.navigate('Chat')}
          >
            <Text style={styles.startChatButtonText}>Start New Chat</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.chatListContainer}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
      
      <LinearGradient
        colors={['#1A1A1A', '#121212', '#050505']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative elements */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        
        <View style={styles.header}>
          <Text style={styles.title}>Chat History</Text>
          {!connected && (
            <Text style={styles.walletWarning}>Wallet not connected</Text>
          )}
        </View>
        
        {renderContent()}
        
        <TouchableOpacity 
          style={styles.newChatButton}
          onPress={() => navigation.navigate('Chat')}
        >
          <LinearGradient
            colors={[COLORS.brandPrimary, '#2AABB3']}
            style={styles.newChatButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.newChatButtonText}>New Chat</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  decorCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.brandPrimaryAlpha.a10,
    top: -50,
    left: -50,
  },
  decorCircle2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(181, 145, 255, 0.04)',
    bottom: 100,
    right: -100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkText.primary,
    textShadowColor: COLORS.brandPrimaryAlpha.a50,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  walletWarning: {
    color: '#FF6B6B',
    marginTop: 5,
    fontSize: 12,
  },
  chatListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80, // Make room for the new chat button
  },
  chatItem: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  chatItemGradient: {
    width: '100%',
    padding: 12,
  },
  chatItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatItemAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.brandPrimaryAlpha.a30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatItemAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkText.primary,
  },
  chatItemDetails: {
    flex: 1,
  },
  chatItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkText.primary,
  },
  chatItemTime: {
    fontSize: 12,
    color: COLORS.darkText.tertiary,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    color: COLORS.darkText.secondary,
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
  },
  emptyText: {
    color: COLORS.darkText.secondary,
    fontSize: 16,
    marginBottom: 20,
  },
  connectButton: {
    backgroundColor: COLORS.brandPrimary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginTop: 16,
  },
  connectButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  startChatButton: {
    backgroundColor: COLORS.brandPrimary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  startChatButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  newChatButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 120,
    height: 45,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  newChatButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newChatButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
}); 