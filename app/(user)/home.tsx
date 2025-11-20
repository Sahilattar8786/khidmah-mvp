import { Aalim, aalimService } from '@/services/aalimService';
import { chatService } from '@/services/chatService';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function UserHomeScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [aalims, setAalims] = useState<Aalim[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState<string | null>(null);

  useEffect(() => {
    const loadAalims = async () => {
      try {
        setLoading(true);
        const availableAalims = await aalimService.getAvailableAalims();
        console.log('✅ Loaded', availableAalims.length, 'available aalims');
        setAalims(availableAalims);
      } catch (error) {
        console.error('Error loading aalims:', error);
        Alert.alert('Error', 'Failed to load aalims. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadAalims();
  }, []);

  const handleStartChat = async (aalimId: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    try {
      setStartingChat(aalimId);
      // Create chat with specific aalim, including user name and email
      const userName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined;
      const userEmail = user.emailAddresses[0]?.emailAddress;
      const chatId = await chatService.createChat(user.id, aalimId, userName, userEmail);
      console.log('✅ Chat created with aalim, navigating to chat...');
      router.push(`/(user)/chat/${chatId}`);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to start chat';
      Alert.alert('Error', errorMessage);
      console.error('Chat creation error:', error);
    } finally {
      setStartingChat(null);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" />
        <Text className="text-gray-500 mt-4">Loading aalims...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white p-4">
      <View className="px-4 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold">Welcome</Text>
        <Text className="text-gray-600">{user?.emailAddresses[0]?.emailAddress}</Text>
      </View>

      {aalims.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-gray-500 text-center text-lg mb-2">No Aalims Available</Text>
          <Text className="text-gray-400 text-center text-sm">
            Please check back later or contact support
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          <Text className="text-lg font-semibold mb-4 text-gray-800">
            Available Aalims
          </Text>
          {aalims.map((aalim) => (
            <View
              key={aalim.clerkId}
              className="bg-white border-2 border-gray-200 rounded-xl p-4 mb-4 shadow-sm"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-3">
                      <Text className="text-blue-600 text-xl font-bold">
                        {aalim.name?.[0]?.toUpperCase() || 'A'}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-gray-900">
                        {aalim.name || 'Aalim'}
                      </Text>
                      {aalim.email && (
                        <Text className="text-sm text-gray-500">{aalim.email}</Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity
                onPress={() => handleStartChat(aalim.clerkId)}
                disabled={startingChat === aalim.clerkId}
                className={`mt-3 py-3 rounded-lg ${
                  startingChat === aalim.clerkId
                    ? 'bg-gray-400'
                    : 'bg-blue-600'
                }`}
                activeOpacity={0.8}
              >
                {startingChat === aalim.clerkId ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white text-center font-semibold">
                    Start Chat
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

