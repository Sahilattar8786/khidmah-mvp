import { ChatInput } from '@/components/ChatInput';
import { ChatMessage } from '@/components/ChatMessage';
import { useChat } from '@/hooks/useChat';
import { chatService } from '@/services/chatService';
import { notificationService } from '@/services/notificationService';
import { useUser } from '@clerk/clerk-expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

export default function ChatScreen() {
  const params = useLocalSearchParams<{ chatId: string | string[] }>();
  // Handle chatId as string or array (Expo Router can return either)
  const chatId = Array.isArray(params.chatId) ? params.chatId[0] : params.chatId;
  const { user } = useUser();
  const router = useRouter();
  const { messages, loading, sendMessage, error } = useChat(chatId || null, user?.id);
  const flatListRef = useRef<FlatList>(null);
  const [deleting, setDeleting] = useState(false);
  const [chatInfo, setChatInfo] = useState<{ aalimName?: string } | null>(null);
  
  console.log('💬 ChatScreen: chatId =', chatId);

  // Load chat info and request notification permissions
  useEffect(() => {
    if (!chatId) return;

    // Request notification permissions
    notificationService.requestPermissions();

    // Load chat info
    const loadChatInfo = async () => {
      try {
        const chat = await chatService.getChatById(chatId);
        if (chat) {
          // Get aalim info
          const { aalimService } = await import('@/services/aalimService');
          const aalims = await aalimService.getAvailableAalims();
          const aalim = aalims.find(a => a.clerkId === chat.aalimId);
          if (aalim) {
            setChatInfo({
              aalimName: aalim.name || 'Aalim',
            });
          }
        }
      } catch (error) {
        console.error('Error loading chat info:', error);
      }
    };

    loadChatInfo();
  }, [chatId]);

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

  const handleCloseChat = () => {
    if (!chatId) return;

    Alert.alert(
      'Close Chat',
      'Are you sure you want to close this chat? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Close',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await chatService.deleteChat(chatId);
              console.log('✅ Chat closed, navigating to home...');
              router.replace('/(user)/home');
            } catch (error: any) {
              console.error('Error closing chat:', error);
              Alert.alert('Error', error?.message || 'Failed to close chat');
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const displayName = chatInfo?.aalimName || 'Aalim';
  const screenWidth = Dimensions.get('window').width;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View className="flex-1">
          {/* Attractive Header - Matching Aalim Design */}
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
                    {displayName[0]?.toUpperCase() || 'A'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold" style={{ fontSize: screenWidth < 375 ? 16 : 18 }} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text className="text-blue-100 text-xs mt-0.5">Spiritual Guide</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleCloseChat}
                disabled={deleting}
                className="w-10 h-10 items-center justify-center ml-2"
                activeOpacity={0.7}
              >
                {deleting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white text-lg">✕</Text>
                )}
              </TouchableOpacity>
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

