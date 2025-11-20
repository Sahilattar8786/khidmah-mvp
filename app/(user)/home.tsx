import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { chatService } from '@/services/chatService';

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
      const chatId = await chatService.createChat(user.id);
      router.push(`/(user)/chat/${chatId}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to start chat');
      console.error(error);
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

