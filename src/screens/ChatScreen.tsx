import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import COLORS from '../assets/colors';
import { useChat } from '../hooks/useChat';
import { generateUUID } from '@/lib/utils';
import { useRoute } from '@react-navigation/native';
import { useWallet } from '@/walletProviders';
import type { Message } from 'ai';
import ErrorHandler from '@/components/ErrorHandler';

const { width, height } = Dimensions.get('window');

export default function ChatScreen() {
  // Get route parameters first outside of any hooks
  const route = useRoute();
  const routeParams = (route.params as { id?: string }) || {};
  
  // Then initialize chatId in a consistent manner
  const [chatId] = useState(() => routeParams.id || generateUUID());
  
  const { connected } = useWallet();
  
  // Call useChat after ensuring chatId is always available
  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    input, 
    setInput,
    status,
    setError 
  } = useChat({ 
    id: chatId,
    // Only attempt to load messages if this is an existing chat (id provided via route)
    initialMessages: routeParams.id ? undefined : [] 
  });
  
  const flatListRef = useRef<FlatList>(null);

  // Scroll to bottom when new messages come in
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages.length]); // Only depend on messages.length, not the entire messages array

  const handleSendMessage = useCallback(() => {
    if (!connected) {
      setError("Please connect your wallet first");
      return;
    }

    if (input.trim().length === 0) {
      setError("Message cannot be empty");
      return;
    }
    
    // Create a properly formatted message object with required text field
    const messageText = input.trim();
    const newMessage: Message = {
      id: generateUUID(),
      content: messageText,
      role: "user",
      parts: [{ 
        type: "text" as const, 
        text: messageText 
      }],
    };
    
    sendMessage(newMessage);
    setInput('');
  }, [input, sendMessage, setInput, connected, setError]);

  const formatTime = useCallback((timestamp: Date | string | undefined): string => {
    if (!timestamp) return '';
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const renderMessage = useCallback(({ item }: { item: any }) => {
    const isUser = item.role === 'user';
    // Ensure we extract text content consistently even if parts structure varies
    const messageText = item.content || 
      item.parts?.find((part: any) => part.type === 'text')?.text || 
      '';
    const timestamp = item.createdAt ? new Date(item.createdAt) : new Date();
    
    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.systemMessage]}>
        <LinearGradient
          colors={isUser ? ['#32D4DE', '#2AABB3'] : ['#2A2A2A', '#303030']}
          style={styles.messageBubble}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.messageText}>{messageText}</Text>
          <Text style={styles.timestampText}>{formatTime(timestamp)}</Text>
        </LinearGradient>
      </View>
    );
  }, [formatTime]);

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
          <Text style={styles.title}>Chat</Text>
          {!connected && (
            <Text style={styles.walletWarning}>Wallet not connected</Text>
          )}
        </View>
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.chatContainer}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          {/* Error handler */}
          <ErrorHandler 
            error={error} 
            onDismiss={() => setError(null)}
          />
          
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContainer}
            inverted={false}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No messages yet. Start a conversation!
                </Text>
              </View>
            }
          />
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.darkText.tertiary}
              value={input}
              onChangeText={setInput}
              multiline
              editable={status !== 'submitted' && status !== 'streaming'}
            />
            {isLoading ? (
              <View style={styles.loadingButton}>
                <ActivityIndicator color={COLORS.white} />
              </View>
            ) : (
              <TouchableOpacity 
                style={[
                  styles.sendButton,
                  (!connected || input.trim().length === 0 || status === 'submitted' || status === 'streaming') && styles.disabledButton
                ]}
                onPress={handleSendMessage}
                disabled={input.trim().length === 0 || status === 'submitted' || status === 'streaming' || !connected}
              >
                <LinearGradient
                  colors={[COLORS.brandPrimary, '#2AABB3']}
                  style={styles.sendButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.sendButtonText}>Send</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
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
  chatContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexGrow: 1,
    minHeight: '100%',
  },
  messageContainer: {
    marginVertical: 8,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  systemMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    minHeight: 40,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  messageText: {
    color: COLORS.white,
    fontSize: 16,
  },
  timestampText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.darkSurface.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    color: COLORS.darkText.primary,
  },
  sendButton: {
    width: 70,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingButton: {
    width: 70,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(50, 212, 222, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    padding: 12,
    borderRadius: 10,
    margin: 16,
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: height * 0.5,
  },
  emptyText: {
    color: COLORS.darkText.tertiary,
    fontSize: 16,
    textAlign: 'center',
  }
}); 