import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { roleService } from '@/services/roleService';

export default function SignupScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'aalim' | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSignUpPress = async () => {
    if (!isLoaded || !role) {
      Alert.alert('Error', 'Please select a role');
      return;
    }

    try {
      setLoading(true);
      const result = await signUp.create({
        emailAddress: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        
        // Store role in Firebase
        if (result.createdUserId) {
          await roleService.setUserRole(result.createdUserId, role);
        }
        
        // Redirect based on role
        if (role === 'user') {
          router.replace('/(user)/home');
        } else {
          router.replace('/(aalim)/home');
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-bold mb-8 text-center">Sign Up</Text>
      
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-6"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Text className="mb-3 font-semibold">Select Role:</Text>
      <View className="flex-row mb-6">
        <TouchableOpacity
          onPress={() => setRole('user')}
          className={`flex-1 py-3 rounded-lg mr-2 ${
            role === 'user' ? 'bg-blue-500' : 'bg-gray-200'
          }`}
        >
          <Text className={`text-center font-semibold ${
            role === 'user' ? 'text-white' : 'text-black'
          }`}>
            User
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setRole('aalim')}
          className={`flex-1 py-3 rounded-lg ml-2 ${
            role === 'aalim' ? 'bg-blue-500' : 'bg-gray-200'
          }`}
        >
          <Text className={`text-center font-semibold ${
            role === 'aalim' ? 'text-white' : 'text-black'
          }`}>
            Aalim
          </Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        onPress={onSignUpPress}
        disabled={loading || !role}
        className={`py-3 rounded-lg ${
          loading || !role ? 'bg-gray-400' : 'bg-blue-500'
        }`}
      >
        <Text className="text-white text-center font-semibold">
          {loading ? 'Signing up...' : 'Sign Up'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/(auth)/login')}
        className="mt-4"
      >
        <Text className="text-center text-blue-500">
          Already have an account? Sign in
        </Text>
      </TouchableOpacity>
    </View>
  );
}

