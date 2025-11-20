import { Aalim, aalimService } from '@/services/aalimService';
import { chatService } from '@/services/chatService';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

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

  const screenWidth = Dimensions.get('window').width;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center bg-gray-50">
          <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-4">
            <Text className="text-blue-600 text-2xl">🕌</Text>
          </View>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-500 mt-4">Loading aalims...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 bg-gray-50">
        {/* Attractive Header */}
        <View className="bg-blue-600 px-4 py-5 shadow-lg">
          <Text className="text-white text-2xl font-bold mb-1">Welcome</Text>
          <Text className="text-blue-100 text-sm">
            {user?.firstName || user?.emailAddresses[0]?.emailAddress}
          </Text>
        </View>

        {aalims.length === 0 ? (
          <View className="flex-1 justify-center items-center px-6">
            <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4">
              <Text className="text-blue-600 text-4xl">🕌</Text>
            </View>
            <Text className="text-gray-600 text-center text-lg font-semibold mb-2">No Aalims Available</Text>
            <Text className="text-gray-400 text-center text-sm px-4">
              Please check back later or contact support
            </Text>
          </View>
        ) : (
          <ScrollView 
            className="flex-1" 
            contentContainerStyle={{ 
              padding: screenWidth < 375 ? 12 : 16,
              paddingBottom: 20
            }}
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-lg font-semibold mb-4 text-gray-800 px-1">
              Available Aalims
            </Text>
            {aalims.map((aalim) => {
              const initials = aalim.name 
                ? aalim.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) 
                : 'A';
              
              return (
                <View
                  key={aalim.clerkId}
                  className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
                >
                  <View className="flex-row items-center mb-3">
                    <View className="w-14 h-14 bg-blue-100 rounded-full items-center justify-center mr-3">
                      <Text className="text-blue-600 font-bold text-lg">
                        {initials}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-gray-900 mb-1" numberOfLines={1}>
                        {aalim.name || 'Aalim'}
                      </Text>
                      {aalim.email && (
                        <Text className="text-sm text-gray-500" numberOfLines={1}>
                          {aalim.email}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    onPress={() => handleStartChat(aalim.clerkId)}
                    disabled={startingChat === aalim.clerkId}
                    className={`py-3 rounded-xl ${
                      startingChat === aalim.clerkId
                        ? 'bg-gray-400'
                        : 'bg-blue-600'
                    }`}
                    activeOpacity={0.8}
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 3,
                      elevation: 3,
                    }}
                  >
                    {startingChat === aalim.clerkId ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text className="text-white text-center font-semibold text-base">
                        Start Chat
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

