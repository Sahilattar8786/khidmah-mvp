import { chatService } from '@/services/chatService';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';

export default function UserHomeScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStartChat = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    try {
      setLoading(true);
      // Create chat - automatically assigns an available aalim
      const chatId = await chatService.createChat(user.id);
      console.log('✅ Chat created with aalim, navigating to chat...');
      router.push(`/(user)/chat/${chatId}`);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to start chat';
      Alert.alert('Error', errorMessage);
      console.error('Chat creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center items-center px-6 bg-white">
      <Text className="text-2xl font-bold mb-8">Welcome, {user?.emailAddresses[0]?.emailAddress}</Text>
      
      <TouchableOpacity
        onPress={handleStartChat}
        disabled={loading}
        className={`px-8 py-4 rounded-lg ${
          loading ? 'bg-gray-400' : 'bg-blue-500'
        }`}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-lg font-semibold">Start Free Chat</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

