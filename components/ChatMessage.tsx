import { Message } from '@/services/chatService';
import { Text, View } from 'react-native';

interface ChatMessageProps {
  message: Message;
  currentUserId: string;
}

export function ChatMessage({ message, currentUserId }: ChatMessageProps) {
  const isOwnMessage = message.senderId === currentUserId;

  return (
    <View className={`flex-row ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}>
      <View
        className={`max-w-[75%] px-4 py-2 rounded-2xl ${
          isOwnMessage ? 'bg-blue-500' : 'bg-gray-200'
        }`}
      >
        <Text className={`${isOwnMessage ? 'text-white' : 'text-black'}`}>
          {message.text}
        </Text>
      </View>
    </View>
  );
}

