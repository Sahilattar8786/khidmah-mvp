import { ChatInput } from '@/components/ChatInput';
import { ChatMessage } from '@/components/ChatMessage';
import { useChat } from '@/hooks/useChat';
import { chatService } from '@/services/chatService';
import { useUser } from '@clerk/clerk-expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from 'react-native';

export default function ChatScreen() {
  const params = useLocalSearchParams<{ chatId: string | string[] }>();
  // Handle chatId as string or array (Expo Router can return either)
  const chatId = Array.isArray(params.chatId) ? params.chatId[0] : params.chatId;
  const { user } = useUser();
  const router = useRouter();
  const { messages, loading, sendMessage, error } = useChat(chatId || null, user?.id);
  const flatListRef = useRef<FlatList>(null);
  const [deleting, setDeleting] = useState(false);
  
  console.log('💬 ChatScreen: chatId =', chatId);

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1">
        <View className="px-4 py-3 border-b border-gray-200 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-lg font-semibold">Chat</Text>
            {chatId && <Text className="text-xs text-gray-500">ID: {chatId}</Text>}
          </View>
          <TouchableOpacity
            onPress={handleCloseChat}
            disabled={deleting}
            className="px-4 py-2 bg-red-500 rounded-lg"
            activeOpacity={0.8}
          >
            {deleting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-white font-semibold">Close</Text>
            )}
          </TouchableOpacity>
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

