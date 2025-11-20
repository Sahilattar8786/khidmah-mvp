import { ChatInput } from '@/components/ChatInput';
import { ChatMessage } from '@/components/ChatMessage';
import { useChat } from '@/hooks/useChat';
import { chatService } from '@/services/chatService';
import { notificationService } from '@/services/notificationService';
import { useUser } from '@clerk/clerk-expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

export default function AalimChatScreen() {
  const params = useLocalSearchParams<{ chatId: string | string[] }>();
  // Handle chatId as string or array (Expo Router can return either)
  const chatId = Array.isArray(params.chatId) ? params.chatId[0] : params.chatId;
  const { user } = useUser();
  const router = useRouter();
  const { messages, loading, sendMessage, error } = useChat(chatId || null);
  const flatListRef = useRef<FlatList>(null);
  const [chatInfo, setChatInfo] = useState<{ userName?: string; userEmail?: string } | null>(null);
  const previousMessagesCount = useRef(0);
  
  console.log('💬 AalimChatScreen: chatId =', chatId);

  // Load chat info and request notification permissions
  useEffect(() => {
    if (!chatId) return;

    // Request notification permissions
    notificationService.requestPermissions();

    // Load chat info to get user name (using direct document fetch - no index needed)
    const loadChatInfo = async () => {
      try {
        const chat = await chatService.getChatById(chatId);
        if (chat) {
          setChatInfo({
            userName: chat.userName,
            userEmail: chat.userEmail,
          });
        }
      } catch (error) {
        console.error('Error loading chat info:', error);
      }
    };

    loadChatInfo();
  }, [chatId, user?.id]);

  // Send notification when new message arrives (only if not from current user)
  useEffect(() => {
    if (messages.length > previousMessagesCount.current && messages.length > 0 && chatId) {
      const latestMessage = messages[messages.length - 1];
      // Only notify if message is from the other user (not from aalim)
      if (latestMessage.senderId !== user?.id) {
        const userName = chatInfo?.userName || 'User';
        notificationService.sendNotification(
          `New message from ${userName}`,
          latestMessage.text.length > 50 
            ? latestMessage.text.substring(0, 50) + '...' 
            : latestMessage.text,
          { chatId }
        );
      }
    }
    previousMessagesCount.current = messages.length;
  }, [messages, user?.id, chatInfo, chatId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!user?.id) return;
    try {
      await sendMessage(user.id, text);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const displayName = chatInfo?.userName || chatInfo?.userEmail || 'User';
  const screenWidth = Dimensions.get('window').width;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View className="flex-1">
          {/* Attractive Header */}
          <View className="bg-blue-600 px-4 py-4 shadow-lg" style={{ paddingTop: Platform.OS === 'ios' ? 8 : 16 }}>
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 items-center justify-center mr-2"
                activeOpacity={0.7}
              >
                <Text className="text-white text-2xl">←</Text>
              </TouchableOpacity>
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-3 shadow-md" style={{ width: screenWidth < 375 ? 40 : 48, height: screenWidth < 375 ? 40 : 48 }}>
                  <Text className="text-blue-600 font-bold" style={{ fontSize: screenWidth < 375 ? 16 : 20 }}>
                    {displayName[0]?.toUpperCase() || 'U'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold" style={{ fontSize: screenWidth < 375 ? 16 : 18 }} numberOfLines={1}>
                    {displayName}
                  </Text>
                  {chatInfo?.userEmail && chatInfo?.userName && (
                    <Text className="text-blue-100 text-xs mt-0.5" numberOfLines={1}>
                      {chatInfo.userEmail}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>
          
          {error && (
            <View className="px-4 py-2 bg-red-50 border-b border-red-200">
              <Text className="text-red-600 text-sm">{error}</Text>
            </View>
          )}
          
          {loading && messages.length === 0 ? (
            <View className="flex-1 justify-center items-center bg-gray-50">
              <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-4">
                <Text className="text-blue-600 text-2xl">💬</Text>
              </View>
              <Text className="text-gray-500 text-lg">Loading messages...</Text>
            </View>
          ) : (
            <View className="flex-1 bg-gray-50">
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <ChatMessage message={item} currentUserId={user?.id || ''} />
                )}
                contentContainerStyle={{ 
                  padding: screenWidth < 375 ? 12 : 16, 
                  flexGrow: 1,
                  paddingBottom: 20
                }}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }}
                onLayout={() => {
                  if (messages.length > 0) {
                    flatListRef.current?.scrollToEnd({ animated: false });
                  }
                }}
                ListEmptyComponent={
                  <View className="flex-1 justify-center items-center py-12 px-4">
                    <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
                      <Text className="text-blue-600 text-3xl">💭</Text>
                    </View>
                    <Text className="text-gray-600 text-lg font-semibold mb-2 text-center">
                      No messages yet
                    </Text>
                    <Text className="text-gray-400 text-sm text-center px-4">
                      Start the conversation by sending a message
                    </Text>
                  </View>
                }
              />
            </View>
          )}
          
          <ChatInput onSend={handleSend} disabled={loading} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

