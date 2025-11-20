import { ChatInput } from '@/components/ChatInput';
import { ChatMessage } from '@/components/ChatMessage';
import { useChat } from '@/hooks/useChat';
import { useUser } from '@clerk/clerk-expo';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Text, View } from 'react-native';

export default function AalimChatScreen() {
  const params = useLocalSearchParams<{ chatId: string | string[] }>();
  // Handle chatId as string or array (Expo Router can return either)
  const chatId = Array.isArray(params.chatId) ? params.chatId[0] : params.chatId;
  const { user } = useUser();
  const { messages, loading, sendMessage, error } = useChat(chatId || null);
  const flatListRef = useRef<FlatList>(null);
  
  console.log('💬 AalimChatScreen: chatId =', chatId);

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1">
        <View className="px-4 py-3 border-b border-gray-200">
          <Text className="text-lg font-semibold">Chat</Text>
          {chatId && <Text className="text-xs text-gray-500">ID: {chatId}</Text>}
        </View>
        
        {error && (
          <View className="px-4 py-2 bg-red-50 border-b border-red-200">
            <Text className="text-red-600 text-sm">{error}</Text>
          </View>
        )}
        
        {loading && messages.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-500">Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatMessage message={item} currentUserId={user?.id || ''} />
            )}
            contentContainerStyle={{ padding: 16, flexGrow: 1 }}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }}
            onLayout={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center py-8">
                <Text className="text-gray-500">No messages yet. Start the conversation!</Text>
              </View>
            }
          />
        )}
        
        <ChatInput onSend={handleSend} disabled={loading} />
      </View>
    </KeyboardAvoidingView>
  );
}

