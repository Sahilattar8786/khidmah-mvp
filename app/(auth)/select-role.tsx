import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { roleService } from '@/services/roleService';

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
      await roleService.setUserRole(user.id, role);
      
      // Redirect based on role
      if (role === 'user') {
        router.replace('/(user)/home');
      } else {
        router.replace('/(aalim)/home');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to set role');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-bold mb-4 text-center">Select Your Role</Text>
      <Text className="text-gray-600 mb-8 text-center">
        Please choose your role to continue
      </Text>

      <View className="flex-row mb-6">
        <TouchableOpacity
          onPress={() => setRole('user')}
          className={`flex-1 py-4 rounded-lg mr-2 ${
            role === 'user' ? 'bg-blue-500' : 'bg-gray-200'
          }`}
        >
          <Text className={`text-center font-semibold text-lg ${
            role === 'user' ? 'text-white' : 'text-black'
          }`}>
            User
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setRole('aalim')}
          className={`flex-1 py-4 rounded-lg ml-2 ${
            role === 'aalim' ? 'bg-blue-500' : 'bg-gray-200'
          }`}
        >
          <Text className={`text-center font-semibold text-lg ${
            role === 'aalim' ? 'text-white' : 'text-black'
          }`}>
            Aalim
          </Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        onPress={onSelectRole}
        disabled={loading || !role}
        className={`py-3 rounded-lg ${
          loading || !role ? 'bg-gray-400' : 'bg-blue-500'
        }`}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center font-semibold">
            Continue
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

