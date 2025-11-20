import OAuth from '@/components/OAuth';
import { useSignIn } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPhone, setIsPhone] = useState(false);

  // Check if input is phone number
  const checkIfPhone = (text: string) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleaned = text.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleaned) || (cleaned.length > 5 && /^\d+$/.test(cleaned));
  };

  const handleIdentifierChange = (text: string) => {
    setIdentifier(text);
    setIsPhone(checkIfPhone(text));
  };

  const onSignInPress = useCallback(async () => {
    if (!isLoaded) {
      return;
    }

    if (!identifier || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const signInAttempt = await signIn.create({
        identifier: identifier, // Clerk handles both email and phone automatically
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        console.log('✅ Sign in successful, session activated');
        // Role-based routing will be handled by root layout
        // Small delay to ensure session is fully set
        setTimeout(() => {
          console.log('Session should be active now');
        }, 500);
      } else {
        // Handle other statuses (e.g., needs verification)
        console.log('Sign in status (not complete):', signInAttempt.status);
        Alert.alert('Verification Required', 'Please complete verification to sign in');
      }
    } catch (err: any) {
      console.error('Sign in error:', JSON.stringify(err, null, 2));
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  }, [isLoaded, identifier, password, signIn, setActive]);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
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
            <Text className="text-4xl font-bold text-gray-900 mb-2">Welcome Back</Text>
            <Text className="text-gray-600 text-base">Sign in to continue to Khidmah</Text>
          </View>

          {/* Form */}
          <View className="mb-6">
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-2 text-sm">Email or Phone Number</Text>
              <TextInput
                className="bg-white border-2 border-gray-200 rounded-xl px-4 py-4 text-base shadow-sm focus:border-blue-500"
                placeholder={isPhone ? "Enter your phone number" : "Enter your email or phone"}
                placeholderTextColor="#9CA3AF"
                value={identifier}
                onChangeText={handleIdentifierChange}
                autoCapitalize="none"
                keyboardType={isPhone ? "phone-pad" : "default"}
                editable={!loading}
              />
              <Text className="text-gray-500 text-xs mt-1">
                {isPhone ? "Phone format: +1234567890" : "Enter email or phone number"}
              </Text>
            </View>
            
            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-2 text-sm">Password</Text>
              <TextInput
                className="bg-white border-2 border-gray-200 rounded-xl px-4 py-4 text-base shadow-sm focus:border-blue-500"
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>
            
            <TouchableOpacity
              onPress={onSignInPress}
              disabled={loading}
              className={`py-4 rounded-xl shadow-lg mb-4 ${
                loading ? 'bg-gray-400' : 'bg-blue-600'
              }`}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white text-center font-bold text-lg">
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            {/* OAuth Component */}
            <OAuth />
          </View>

          {/* Footer */}
          <View className="items-center">
            <Text className="text-gray-600 mb-4">Don't have an account?</Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity
                className="border-2 border-blue-600 py-3 px-8 rounded-xl"
                activeOpacity={0.7}
              >
                <Text className="text-blue-600 text-center font-semibold text-base">
                  Create Account
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

