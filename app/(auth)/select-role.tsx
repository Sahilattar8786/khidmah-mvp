import { roleService } from '@/services/roleService';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function SelectRoleScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [role, setRole] = useState<'user' | 'aalim' | null>(null);
  const [loading, setLoading] = useState(false);

  const onSelectRole = async () => {
    if (!role || !user?.id) {
      Alert.alert('Error', 'Please select a role');
      return;
    }

    try {
      setLoading(true);
      await roleService.setUserRole(user.id, role, user);
      
      // Let root layout handle routing based on role
      // Navigation will happen automatically via useEffect in _layout.tsx
      // Small delay to ensure role is saved before navigation
      setTimeout(() => {
        try {
          if (role === 'user') {
            router.replace('/(user)/home');
          } else {
            router.replace('/(aalim)/home');
          }
        } catch (error) {
          // Navigation will happen automatically via root layout
          console.log('Router navigation will happen automatically');
        }
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to set role');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={{ flexGrow: 1 }}
      className="bg-blue-50"
    >
      <View className="flex-1 justify-center px-6 py-12">
        {/* Header */}
        <View className="items-center mb-12">
          <View className="bg-blue-600 w-20 h-20 rounded-full items-center justify-center mb-4 shadow-lg">
            <Text className="text-white text-3xl font-bold">K</Text>
          </View>
          <Text className="text-4xl font-bold text-gray-900 mb-2">Choose Your Role</Text>
          <Text className="text-gray-600 text-base text-center px-4">
            Select how you'd like to use Khidmah
          </Text>
        </View>

        {/* Role Selection Cards */}
        <View className="mb-8">
          <View className="flex-row gap-4 mb-4">
            <TouchableOpacity
              onPress={() => setRole('user')}
              disabled={loading}
              className={`flex-1 py-6 rounded-2xl border-2 ${
                role === 'user' 
                  ? 'bg-blue-600 border-blue-600 shadow-xl' 
                  : 'bg-white border-gray-200 shadow-sm'
              }`}
              activeOpacity={0.7}
            >
              <View className="items-center">
                <View className={`w-12 h-12 rounded-full items-center justify-center mb-3 ${
                  role === 'user' ? 'bg-blue-500' : 'bg-gray-100'
                }`}>
                  <Text className={`text-2xl ${role === 'user' ? 'text-white' : 'text-gray-600'}`}>
                    👤
                  </Text>
                </View>
                <Text className={`text-center font-bold text-lg mb-1 ${
                  role === 'user' ? 'text-white' : 'text-gray-900'
                }`}>
                  User
                </Text>
                <Text className={`text-center text-xs px-2 ${
                  role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  Seeking guidance
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setRole('aalim')}
              disabled={loading}
              className={`flex-1 py-6 rounded-2xl border-2 ${
                role === 'aalim' 
                  ? 'bg-blue-600 border-blue-600 shadow-xl' 
                  : 'bg-white border-gray-200 shadow-sm'
              }`}
              activeOpacity={0.7}
            >
              <View className="items-center">
                <View className={`w-12 h-12 rounded-full items-center justify-center mb-3 ${
                  role === 'aalim' ? 'bg-blue-500' : 'bg-gray-100'
                }`}>
                  <Text className={`text-2xl ${role === 'aalim' ? 'text-white' : 'text-gray-600'}`}>
                    🕌
                  </Text>
                </View>
                <Text className={`text-center font-bold text-lg mb-1 ${
                  role === 'aalim' ? 'text-white' : 'text-gray-900'
                }`}>
                  Aalim
                </Text>
                <Text className={`text-center text-xs px-2 ${
                  role === 'aalim' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  Providing guidance
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Continue Button */}
        <TouchableOpacity
          onPress={onSelectRole}
          disabled={loading || !role}
          className={`py-4 rounded-xl shadow-lg ${
            loading || !role ? 'bg-gray-400' : 'bg-blue-600'
          }`}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="text-white text-center font-bold text-lg">
              Continue
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

