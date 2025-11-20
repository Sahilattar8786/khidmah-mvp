import { aalimService } from '@/services/aalimService';
import { Chat, chatService } from '@/services/chatService';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';

export default function AalimHomeScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Register aalim in Firebase when they first load the screen
    const registerAalim = async () => {
      try {
        await aalimService.registerAalim(
          user.id,
          user.emailAddresses[0]?.emailAddress,
          `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined
        );
      } catch (error) {
        console.error('Error registering aalim:', error);
      }
    };

    registerAalim();

    // Set up real-time subscription for chats
    console.log('🔔 Setting up real-time subscription for aalim chats');
    setLoading(true);
    setError(null);

    const unsubscribe = chatService.subscribeToAalimChats(user.id, (newChats) => {
      console.log('📬 Received', newChats.length, 'chats in real-time');
      setChats(newChats);
      setLoading(false);
      setError(null);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔕 Cleaning up aalim chats subscription');
      unsubscribe();
    };
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
        <Text className="text-gray-400 text-xs mt-1">Your ID: {user?.id}</Text>
      </View>
      
      {error ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-red-500 text-center font-semibold mb-2">Error Loading Chats</Text>
          <Text className="text-gray-600 text-center text-sm">{error}</Text>
          <Text className="text-gray-400 text-xs mt-4 text-center">
            Check console logs for more details
          </Text>
        </View>
      ) : chats.length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-gray-500 text-center">No chats assigned yet</Text>
          <Text className="text-gray-400 text-sm mt-2 text-center">
            Chats will appear here when users start conversations with you
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            // Display user name if available, otherwise fallback to email or userId
            const displayName = item.userName || item.userEmail || item.userId;
            return (
              <TouchableOpacity
                onPress={() => handleChatPress(item.id)}
                className="px-4 py-3 border-b border-gray-200"
              >
                <Text className="font-semibold">Chat with {displayName}</Text>
                {item.userEmail && item.userName && (
                  <Text className="text-gray-500 text-xs mt-1">{item.userEmail}</Text>
                )}
                <Text className="text-gray-500 text-sm mt-1">Tap to open</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

