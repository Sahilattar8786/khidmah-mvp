import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { chatService, Chat } from '@/services/chatService';

export default function AalimHomeScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const loadChats = async () => {
      try {
        const aalimChats = await chatService.getAalimChats(user.id);
        setChats(aalimChats);
      } catch (error) {
        console.error('Error loading chats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, [user?.id]);

  const handleChatPress = (chatId: string) => {
    router.push(`/(aalim)/chat/${chatId}`);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 py-3 border-b border-gray-200">
        <Text className="text-2xl font-bold">Assigned Chats</Text>
        <Text className="text-gray-600">Welcome, {user?.emailAddresses[0]?.emailAddress}</Text>
      </View>
      
      {chats.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500">No chats assigned yet</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleChatPress(item.id)}
              className="px-4 py-3 border-b border-gray-200"
            >
              <Text className="font-semibold">Chat with {item.userId}</Text>
              <Text className="text-gray-500 text-sm">Tap to open</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

