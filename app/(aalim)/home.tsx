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

    const loadChats = async () => {
      try {
        console.log('🔍 Loading chats for aalim');
        console.log('📋 Current user ID:', user.id);
        console.log('📋 User email:', user.emailAddresses[0]?.emailAddress);
        console.log('📋 Expected aalimId in Firebase:', user.id);
        setError(null);
        const aalimChats = await chatService.getAalimChats(user.id);
        console.log('✅ Loaded chats:', aalimChats.length);
        console.log('Chats data:', JSON.stringify(aalimChats, null, 2));
        setChats(aalimChats);
      } catch (error: any) {
        console.error('❌ Error loading chats:', error);
        console.error('Error details:', {
          code: error?.code,
          message: error?.message,
          stack: error?.stack
        });
        // Show error to user
        setChats([]);
        let errorMessage = 'Failed to load chats';
        
        // If it's an index error, show helpful message
        if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
          errorMessage = 'Missing Firestore index. Please create the composite index for aalimId + updatedAt';
          console.error('⚠️ Missing Firestore index! Please create the composite index for aalimId + updatedAt');
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        setError(errorMessage);
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

