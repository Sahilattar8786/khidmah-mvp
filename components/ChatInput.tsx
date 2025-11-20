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
    <View className="flex-row items-end px-4 py-3 border-t border-gray-200 bg-white shadow-lg">
      <TextInput
        className="flex-1 border-2 border-gray-200 rounded-2xl px-4 py-3 mr-3 bg-gray-50 text-base"
        placeholder="Type a message..."
        placeholderTextColor="#9CA3AF"
        value={text}
        onChangeText={setText}
        multiline
        maxLength={500}
        editable={!disabled}
        style={{ maxHeight: 100 }}
      />
      <TouchableOpacity
        onPress={handleSend}
        disabled={disabled || !text.trim()}
        className={`w-12 h-12 rounded-full items-center justify-center ${
          disabled || !text.trim() ? 'bg-gray-300' : 'bg-blue-600'
        }`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
          elevation: 3,
        }}
        activeOpacity={0.8}
      >
        <Text className="text-white text-lg font-bold">→</Text>
      </TouchableOpacity>
    </View>
  );
}

