import { Message } from '@/services/chatService';
import { Text, View } from 'react-native';

interface ChatMessageProps {
  message: Message;
  currentUserId: string;
}

export function ChatMessage({ message, currentUserId }: ChatMessageProps) {
  const isOwnMessage = message.senderId === currentUserId;

  return (
    <View className={`flex-row ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 px-2`}>
      <View
        className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${
          isOwnMessage 
            ? 'bg-blue-600 rounded-tr-sm' 
            : 'bg-white border border-gray-200 rounded-tl-sm'
        }`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <Text className={`text-base leading-5 ${
          isOwnMessage ? 'text-white' : 'text-gray-900'
        }`}>
          {message.text}
        </Text>
      </View>
    </View>
  );
}

