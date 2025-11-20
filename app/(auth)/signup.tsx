import OAuth from '@/components/OAuth';
import { roleService } from '@/services/roleService';
import { useSignUp } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SignupScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPhone, setIsPhone] = useState(false);
  const [verification, setVerification] = useState({
    state: 'default', // 'default' | 'pending' | 'success' | 'failed'
    error: '',
    code: '',
  });
  const [modalVisible, setModalVisible] = useState(false);

  // Check if input is phone number (starts with + or contains only digits)
  const checkIfPhone = (text: string) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleaned = text.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleaned) || cleaned.length > 5 && /^\d+$/.test(cleaned);
  };

  const handleIdentifierChange = (text: string) => {
    setIdentifier(text);
    setIsPhone(checkIfPhone(text));
  };

  const onSignUpPress = useCallback(async () => {
    if (!isLoaded) {
      return;
    }

    if (!identifier || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      
      // Create signup with email or phone
      const signUpData: any = {
        password,
      };

      if (isPhone) {
        signUpData.phoneNumber = identifier;
      } else {
        signUpData.emailAddress = identifier;
      }

      await signUp.create(signUpData);

      // Handle verification based on identifier type
      if (isPhone) {
        // Phone verification - redirect to OTP screen
        try {
          await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
          router.push('/(auth)/verify-otp?mode=signup');
        } catch (err: any) {
          console.error('Verification error:', JSON.stringify(err, null, 2));
          Alert.alert('Error', err.errors?.[0]?.message || 'Failed to send verification code');
        }
      } else {
        // Email verification - show modal
        try {
          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
          setVerification({
            ...verification,
            state: 'pending',
            error: '',
          });
        } catch (err: any) {
          console.error('Verification error:', JSON.stringify(err, null, 2));
          Alert.alert('Error', err.errors?.[0]?.message || 'Failed to send verification code');
        }
      }
    } catch (err: any) {
      console.error('Sign up error:', JSON.stringify(err, null, 2));
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  }, [isLoaded, identifier, password, isPhone, signUp, router, verification]);

  const onPressVerify = useCallback(async () => {
    if (!isLoaded) {
      return;
    }

    try {
      setLoading(true);
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      });

      if (completeSignUp.status === 'complete') {
        // Set role to "user" by default BEFORE activating session
        if (completeSignUp.createdUserId) {
          try {
            await roleService.setUserRole(completeSignUp.createdUserId, 'user');
            console.log('✅ User role set to "user" by default');
          } catch (error) {
            console.error('Error setting role (non-blocking):', error);
          }
        }

        await setActive({ session: completeSignUp.createdSessionId });
        console.log('✅ Email verification successful, session activated');

        setVerification({
          ...verification,
          state: 'success',
          error: '',
        });
        setModalVisible(true);
      } else {
        setVerification({
          ...verification,
          state: 'failed',
          error: 'Verification failed',
        });
        console.error('Verification status:', JSON.stringify(completeSignUp, null, 2));
      }
    } catch (err: any) {
      console.error('Verification error:', JSON.stringify(err, null, 2));
      setVerification({
        ...verification,
        state: 'failed',
        error: err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Verification failed',
      });
    } finally {
      setLoading(false);
    }
  }, [isLoaded, signUp, setActive, verification]);

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
          <View className="items-center mb-10">
            <View className="bg-blue-600 w-20 h-20 rounded-full items-center justify-center mb-4 shadow-lg">
              <Text className="text-white text-3xl font-bold">K</Text>
            </View>
            <Text className="text-4xl font-bold text-gray-900 mb-2">Create Account</Text>
            <Text className="text-gray-600 text-base text-center">Join Khidmah and get started</Text>
          </View>

          {/* Form */}
          <View className="mb-6">
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-2 text-sm">Email or Phone Number</Text>
              <TextInput
                className="bg-white border-2 border-gray-200 rounded-xl px-4 py-4 text-base shadow-sm focus:border-blue-500"
                placeholder={isPhone ? "Enter your phone number" : "Enter your email"}
                placeholderTextColor="#9CA3AF"
                value={identifier}
                onChangeText={handleIdentifierChange}
                autoCapitalize="none"
                keyboardType={isPhone ? "phone-pad" : "email-address"}
                editable={!loading}
              />
              <Text className="text-gray-500 text-xs mt-1">
                {isPhone ? "Phone number format: +1234567890" : "Email format: user@example.com"}
              </Text>
            </View>
            
            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-2 text-sm">Password</Text>
              <TextInput
                className="bg-white border-2 border-gray-200 rounded-xl px-4 py-4 text-base shadow-sm focus:border-blue-500"
                placeholder="Create a password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>
            
            <TouchableOpacity
              onPress={onSignUpPress}
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
                  Create Account
                </Text>
              )}
            </TouchableOpacity>

            {/* OAuth Component */}
            <OAuth />
          </View>

          {/* Footer */}
          <View className="items-center">
            <Text className="text-gray-600 mb-4">Already have an account?</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity
                className="border-2 border-blue-600 py-3 px-8 rounded-xl"
                activeOpacity={0.7}
              >
                <Text className="text-blue-600 text-center font-semibold text-base">
                  Sign In
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>

      {/* Email Verification Modal */}
      <Modal
        visible={verification.state === 'pending'}
        transparent
        animationType="slide"
        onRequestClose={() => setVerification({ ...verification, state: 'default' })}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl px-7 py-9 min-h-[300px] w-full max-w-md">
            <Text className="text-2xl font-bold mb-2 text-gray-900">Verification</Text>
            <Text className="text-gray-600 mb-6">
              We've sent a verification code to {identifier}
            </Text>
            
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2 text-sm">Verification Code</Text>
              <TextInput
                className="bg-white border-2 border-gray-200 rounded-xl px-4 py-4 text-base"
                placeholder="Enter verification code"
                placeholderTextColor="#9CA3AF"
                value={verification.code}
                onChangeText={(text) => setVerification({ ...verification, code: text })}
                keyboardType="numeric"
                editable={!loading}
              />
              {verification.error && (
                <Text className="text-sm mt-2 text-red-500">{verification.error}</Text>
              )}
            </View>

            <TouchableOpacity
              onPress={onPressVerify}
              disabled={loading || !verification.code}
              className={`py-4 rounded-xl mb-4 ${
                loading || !verification.code ? 'bg-gray-400' : 'bg-blue-600'
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white text-center font-bold text-lg">
                  Verify Email
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setVerification({ ...verification, state: 'default', code: '' })}
              className="py-2"
            >
              <Text className="text-blue-600 text-center font-semibold">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setModalVisible(false);
          router.replace('/(user)/home');
        }}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl px-7 py-9 min-h-[300px] w-full max-w-md items-center">
            <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-5">
              <Text className="text-4xl">✓</Text>
            </View>
            <Text className="text-3xl font-bold text-center mb-2">Verified</Text>
            <Text className="text-base text-gray-400 text-center mb-8">
              You have successfully verified your account
            </Text>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                router.replace('/(user)/home');
              }}
              className="bg-blue-600 py-4 rounded-xl w-full"
            >
              <Text className="text-white text-center font-bold text-lg">
                Continue
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

