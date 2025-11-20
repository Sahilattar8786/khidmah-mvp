import { useEffect, useRef } from 'react';
import { View, Text, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { user } = useUser();
  const { messages, loading, sendMessage } = useChat(chatId);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

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
        </View>
        
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatMessage message={item} currentUserId={user?.id || ''} />
          )}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        />
        
        <ChatInput onSend={handleSend} disabled={loading} />
      </View>
    </KeyboardAvoidingView>
  );
}

