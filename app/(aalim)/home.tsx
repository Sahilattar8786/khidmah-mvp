import { aalimService } from '@/services/aalimService';
import { Chat, chatService } from '@/services/chatService';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

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

  const screenWidth = Dimensions.get('window').width;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-4">
            <Text className="text-blue-600 text-2xl">💬</Text>
          </View>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-4">Loading chats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 bg-gray-50">
        {/* Attractive Header */}
        <View className="bg-blue-600 px-4 py-5 shadow-lg">
          <Text className="text-white text-2xl font-bold mb-1">Assigned Chats</Text>
          <Text className="text-blue-100 text-sm">
            Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}
          </Text>
        </View>
        
        {error ? (
          <View className="flex-1 justify-center items-center px-6">
            <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-4">
              <Text className="text-red-600 text-3xl">⚠️</Text>
            </View>
            <Text className="text-red-500 text-center font-semibold mb-2 text-lg">Error Loading Chats</Text>
            <Text className="text-gray-600 text-center text-sm">{error}</Text>
          </View>
        ) : chats.length === 0 ? (
          <View className="flex-1 justify-center items-center px-6">
            <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4">
              <Text className="text-blue-600 text-4xl">💭</Text>
            </View>
            <Text className="text-gray-600 text-center text-lg font-semibold mb-2">No chats assigned yet</Text>
            <Text className="text-gray-400 text-sm mt-2 text-center px-4">
              Chats will appear here when users start conversations with you
            </Text>
          </View>
        ) : (
          <FlatList
            data={chats}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: screenWidth < 375 ? 12 : 16 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const displayName = item.userName || item.userEmail || item.userId;
              const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';
              
              return (
                <TouchableOpacity
                  onPress={() => handleChatPress(item.id)}
                  className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
                  activeOpacity={0.7}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
                >
                  <View className="flex-row items-center">
                    <View className="w-14 h-14 bg-blue-100 rounded-full items-center justify-center mr-3">
                      <Text className="text-blue-600 font-bold text-lg">
                        {initials}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900 text-base mb-1" numberOfLines={1}>
                        {displayName}
                      </Text>
                      {item.userEmail && item.userName && (
                        <Text className="text-gray-500 text-xs mb-1" numberOfLines={1}>
                          {item.userEmail}
                        </Text>
                      )}
                      <Text className="text-blue-600 text-xs font-medium">Tap to open chat →</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

