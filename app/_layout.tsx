import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { CLERK_PUBLISHABLE_KEY } from '@/config/clerk';
import { useUserRole } from '@/hooks/useUserRole';

function RootLayoutNav() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { role, loading: roleLoading } = useUserRole();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    // Wait for role to load if user is signed in
    if (roleLoading && isSignedIn) {
      return;
    }

    // Get current route segment
    const currentSegment = segments[0];
    const inAuthGroup = currentSegment === '(auth)';
    const inUserGroup = currentSegment === '(user)';
    const inAalimGroup = currentSegment === '(aalim)';

    // If not signed in, ensure we're in auth group
    if (!isSignedIn) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
      return;
    }

    // User is signed in - handle routing based on role
    if (role === 'user') {
      if (!inUserGroup && !inAuthGroup) {
        router.replace('/(user)/home');
      }
    } else if (role === 'aalim') {
      if (!inAalimGroup && !inAuthGroup) {
        router.replace('/(aalim)/home');
      }
    } else if (role === null) {
      // No role set - go to role selection if not already there
      if (!inAuthGroup) {
        router.replace('/(auth)/select-role');
      }
    }
  }, [isSignedIn, isLoaded, role, roleLoading, segments, router]);

  // Show loader only while Clerk is initializing
  // Don't wait for role loading if user is not signed in
  if (!isLoaded || (roleLoading && isSignedIn)) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(user)" />
      <Stack.Screen name="(aalim)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <RootLayoutNav />
      <StatusBar style="auto" />
    </ClerkProvider>
  );
}
