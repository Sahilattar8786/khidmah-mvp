import { roleService } from '@/services/roleService';
import { useSignIn, useSignUp, useUser } from '@clerk/clerk-expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function VerifyOTPScreen() {
  const { signUp, setActive: setActiveSignUp } = useSignUp();
  const { signIn, setActive: setActiveSignIn } = useSignIn();
  const { user } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isSignUp = params.mode === 'signup';
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit code');
      return;
    }

    try {
      setLoading(true);

      if (isSignUp && signUp) {
        // Verify phone for signup
        const result = await signUp.attemptPhoneNumberVerification({ code });
        
        if (result.status === 'complete') {
          // Set role to "user" by default BEFORE activating session
          // This ensures role is set immediately when account is created via OTP
          if (result.createdUserId) {
            try {
              await roleService.setUserRole(result.createdUserId, 'user', user || undefined);
              console.log('✅ User role set to "user" by default (OTP signup)');
            } catch (error) {
              console.error('Error setting role (non-blocking):', error);
              // Continue even if role setting fails - user will default to "user" in hook
            }
          }
          
          await setActiveSignUp({ session: result.createdSessionId });
          console.log('✅ OTP verification successful, session activated');
          
          // Navigation will be handled by root layout
        } else {
          Alert.alert('Error', 'Verification failed. Please try again.');
        }
      } else if (!isSignUp && signIn) {
        // Verify phone for signin - check if phone code strategy is available
        if (signIn.supportedFirstFactors?.some(factor => factor.strategy === 'phone_code')) {
          const result = await signIn.attemptFirstFactor({ 
            strategy: 'phone_code', 
            code 
          });
          
          if (result.status === 'complete') {
            await setActiveSignIn({ session: result.createdSessionId });
            // Navigation will be handled by root layout
          } else {
            Alert.alert('Error', 'Verification failed. Please try again.');
          }
        } else {
          Alert.alert('Error', 'Phone verification not available for this account');
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      if (isSignUp && signUp) {
        // Resend phone verification code
        await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
        Alert.alert('Success', 'Verification code resent');
      } else if (!isSignUp && signIn) {
        // For sign in, use the supported first factor
        const phoneFactor = signIn.supportedFirstFactors?.find(
          (factor) => factor.strategy === 'phone_code'
        );
        if (phoneFactor && 'phoneNumberId' in phoneFactor) {
          await signIn.prepareFirstFactor({ 
            strategy: 'phone_code',
            phoneNumberId: phoneFactor.phoneNumberId 
          });
          Alert.alert('Success', 'Verification code resent');
        } else {
          Alert.alert('Error', 'Phone verification not available');
        }
      }
    } catch (err: any) {
      console.error('Resend error:', JSON.stringify(err, null, 2));
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to resend code');
    }
  };

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
            <Text className="text-4xl font-bold text-gray-900 mb-2">Verify Code</Text>
            <Text className="text-gray-600 text-base text-center">
              Enter the verification code sent to your {isSignUp ? 'phone' : 'phone/email'}
            </Text>
          </View>

          {/* Form */}
          <View className="mb-6">
            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-2 text-sm">Verification Code</Text>
              <TextInput
                className="bg-white border-2 border-gray-200 rounded-xl px-4 py-4 text-base shadow-sm text-center text-2xl tracking-widest"
                placeholder="000000"
                placeholderTextColor="#9CA3AF"
                value={code}
                onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
                autoFocus
              />
            </View>
            
            <TouchableOpacity
              onPress={handleVerify}
              disabled={loading || code.length !== 6}
              className={`py-4 rounded-xl shadow-lg mb-4 ${
                loading || code.length !== 6 ? 'bg-gray-400' : 'bg-blue-600'
              }`}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white text-center font-bold text-lg">
                  Verify
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleResend}
              disabled={loading}
              className="py-3"
            >
              <Text className="text-blue-600 text-center font-semibold text-base">
                Resend Code
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

