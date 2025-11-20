import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <View className="flex-row items-center px-4 py-2 border-t border-gray-200 bg-white">
      <TextInput
        className="flex-1 border border-gray-300 rounded-full px-4 py-2 mr-2"
        placeholder="Type a message..."
        value={text}
        onChangeText={setText}
        multiline
        editable={!disabled}
      />
      <TouchableOpacity
        onPress={handleSend}
        disabled={disabled || !text.trim()}
        className={`px-4 py-2 rounded-full ${
          disabled || !text.trim() ? 'bg-gray-300' : 'bg-blue-500'
        }`}
      >
        <Text className="text-white font-semibold">Send</Text>
      </TouchableOpacity>
    </View>
  );
}

