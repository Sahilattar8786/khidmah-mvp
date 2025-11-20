import { roleService } from '@/services/roleService';
import { useAuth, useOAuth, useSignUp, useUser } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';

export default function OAuth() {
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { signUp: signUpFromHook, setActive: setActiveFromHook, isLoaded } = useSignUp();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onGooglePress = async () => {
    // If already signed in, just navigate to home
    if (isSignedIn) {
      console.log('✅ Already signed in, navigating to home...');
      router.replace('/(user)/home');
      return;
    }

    try {
      setLoading(true);
      console.log('🔵 Starting Google OAuth...');
      
      const redirectUrl = Linking.createURL('/(user)/home');
      console.log('Redirect URL:', redirectUrl);
      
      const result = await startGoogleOAuth({
        redirectUrl,
      });

      // Log what we got back (without stringifying to avoid circular refs)
      console.log('OAuth result received');
      console.log('Result is null/undefined:', result === null || result === undefined);
      if (result) {
        console.log('Result keys:', Object.keys(result));
        console.log('Has createdSessionId:', !!result?.createdSessionId);
        console.log('Has setActive:', !!result?.setActive);
        console.log('Has signUp:', !!result?.signUp);
        console.log('Has signIn:', !!result?.signIn);
        console.log('createdSessionId value:', result?.createdSessionId);
      }

      const { createdSessionId, setActive, signUp, signIn } = result || {};

      // Check sign-up status for missing requirements (like the Next.js example)
      const signUpStatus = signUp?.status as string | undefined;
      const missingFields = (signUp as any)?.missingFields ?? [];
      
      console.log('Sign-up status:', signUpStatus);
      console.log('Missing fields:', missingFields);
      console.log('Has createdSessionId:', !!createdSessionId);
      console.log('Sign-up object:', signUp ? 'exists' : 'null');

      // Handle missing requirements (similar to Next.js example)
      // Use signUp from hook if available (after OAuth flow)
      const activeSignUp = signUp || signUpFromHook;
      const activeSetActive = setActive || setActiveFromHook;
      
      if (signUpStatus === 'missing_requirements' || (activeSignUp && !createdSessionId && activeSignUp.status !== 'complete')) {
        console.log('Sign-up has missing requirements, attempting to complete...');
        console.log('Active sign-up status:', activeSignUp?.status);
        console.log('Missing fields:', missingFields);
        
        try {
          // Try to update sign-up with empty object to see if it completes
          // For OAuth, Clerk usually handles most fields automatically
          if (activeSignUp) {
            const updatedSignUp = await activeSignUp.update({});
            
            if (updatedSignUp?.status === 'complete' && updatedSignUp?.createdSessionId) {
              // Set role before activating session
              if (updatedSignUp.createdUserId) {
                try {
                  await roleService.setUserRole(updatedSignUp.createdUserId, 'user', user || undefined);
                  console.log('✅ User role set to "user" by default (Google OAuth)');
                } catch (error) {
                  console.error('Error setting role (non-blocking):', error);
                }
              }
              
              if (activeSetActive) {
                await activeSetActive({ session: updatedSignUp.createdSessionId });
                console.log('✅ Google OAuth successful, session activated');
                
                // Navigate to home after a short delay
                setTimeout(() => {
                  router.replace('/(user)/home');
                }, 500);
              }
            } else {
              console.error('Sign-up still incomplete after update:', updatedSignUp?.status);
              Alert.alert(
                'Additional Information Required',
                missingFields.length > 0 
                  ? `Please complete: ${missingFields.join(', ')}`
                  : 'Please complete your profile in Clerk dashboard'
              );
            }
          }
        } catch (updateError: any) {
          console.error('Error updating sign-up:', updateError);
          Alert.alert(
            'Error',
            updateError?.errors?.[0]?.message || 'Failed to complete sign-up'
          );
        }
      } else if (createdSessionId) {
        // Normal flow - session created successfully
        if (activeSetActive) {
          // Set role to "user" by default for NEW users (signup)
          if (signUp?.createdUserId) {
            try {
              await roleService.setUserRole(signUp.createdUserId, 'user', user || undefined);
              console.log('✅ User role set to "user" by default (Google OAuth)');
            } catch (error) {
              console.error('Error setting role (non-blocking):', error);
            }
          }

          await activeSetActive({ session: createdSessionId });
          console.log('✅ Google OAuth successful, session activated');
          
          // Navigate to home after a short delay to ensure session is set
          setTimeout(() => {
            router.replace('/(user)/home');
          }, 500);
        } else {
          console.error('setActive is not available in result or hook');
          Alert.alert('Error', 'Failed to activate session');
        }
      } else {
        // No session created - check why
        console.error('No session ID created');
        console.error('Sign-up status:', signUpStatus);
        console.error('Sign-in status:', signIn?.status);
        console.error('Result keys:', result ? Object.keys(result) : 'result is null/undefined');
        
        // Check if user cancelled
        if (result === null || result === undefined) {
          Alert.alert('Cancelled', 'Google sign-in was cancelled');
        } else if (signUpStatus === 'missing_requirements') {
          Alert.alert(
            'Additional Information Required',
            missingFields.length > 0 
              ? `Please complete: ${missingFields.join(', ')}`
              : 'Please complete your profile'
          );
        } else {
          Alert.alert(
            'Error', 
            'Failed to create session. Please make sure Google OAuth is enabled in your Clerk dashboard and the redirect URL is configured correctly.'
          );
        }
      }
    } catch (err: any) {
      console.error('OAuth error:', err);
      
      // Check if error is "already signed in" - if so, just navigate
      const errorMessage = err?.errors?.[0]?.longMessage 
        || err?.errors?.[0]?.message 
        || err?.message 
        || '';
      
      if (errorMessage.includes('already signed in') || errorMessage.includes('already signed')) {
        console.log('User already signed in, navigating to home...');
        router.replace('/(user)/home');
      } else {
        Alert.alert('Error', errorMessage || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="mt-6">
      <TouchableOpacity
        onPress={onGooglePress}
        disabled={loading}
        className={`py-4 rounded-xl border-2 border-gray-300 ${
          loading ? 'bg-gray-200' : 'bg-white'
        }`}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#4285F4" size="small" />
        ) : (
          <View className="flex-row items-center justify-center">
            <Text className="text-2xl mr-2">Google</Text>
            <Text className="text-gray-700 text-center font-semibold text-base">
              Continue with Google
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

