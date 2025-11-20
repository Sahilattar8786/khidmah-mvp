import '@/global.css';
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { clerkConfig } from '@/config/clerk';
import { useUserRole } from '@/hooks/useUserRole';

function RootLayoutNav() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { role, loading: roleLoading } = useUserRole();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigatorReady, setIsNavigatorReady] = useState(false);

  // Ensure navigator is mounted before attempting navigation
  useEffect(() => {
    // Small delay to ensure Stack is mounted
    const timer = setTimeout(() => {
      setIsNavigatorReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Don't navigate until navigator is ready and Clerk is loaded
    if (!isLoaded || !isNavigatorReady) {
      console.log('Waiting for Clerk/navigator to be ready...', { isLoaded, isNavigatorReady });
      return;
    }

    // Get current route segment - only navigate if we have segments
    const currentSegment = segments[0];
    const inAuthGroup = currentSegment === '(auth)';
    const inUserGroup = currentSegment === '(user)';
    const inAalimGroup = currentSegment === '(aalim)';
    const isIndex = !currentSegment;

    console.log('Auth state:', { 
      isSignedIn, 
      role, 
      roleLoading, 
      currentSegment,
      userId: user?.id,
      isLoaded 
    });

    // If not signed in, ensure we're in auth group
    if (!isSignedIn) {
      if (!inAuthGroup && !isIndex) {
        console.log('Not signed in, redirecting to login...');
        setTimeout(() => {
          try {
            router.replace('/(auth)/login');
          } catch (error) {
            console.log('Navigation error (will retry):', error);
          }
        }, 100);
      }
      return;
    }

    // User is signed in - handle routing based on role
    // Don't wait for role if it's taking too long - default to "user"
    // Set a timeout to prevent infinite waiting
    if (roleLoading && isSignedIn) {
      // Wait max 2 seconds for role, then proceed with default
      const timeout = setTimeout(() => {
        console.log('Role loading timeout, using default "user" role');
        const userRole = 'user';
        if (!inUserGroup && !inAuthGroup) {
          router.replace('/(user)/home');
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }

    // Default to user if role is null (new signups default to user)
    const userRole = role || 'user';
    
    if (userRole === 'user') {
      // Navigate to user home if not already there
      if (!inUserGroup && !inAuthGroup) {
        console.log('Routing to user home...', { inUserGroup, inAuthGroup, isIndex, currentSegment });
        setTimeout(() => {
          try {
            router.replace('/(user)/home');
          } catch (error) {
            console.log('Navigation error (will retry):', error);
          }
        }, 100);
      }
    } else if (userRole === 'aalim') {
      // Navigate to aalim home if not already there
      if (!inAalimGroup && !inAuthGroup) {
        console.log('Routing to aalim home...', { inAalimGroup, inAuthGroup, isIndex, currentSegment });
        setTimeout(() => {
          try {
            router.replace('/(aalim)/home');
          } catch (error) {
            console.log('Navigation error (will retry):', error);
          }
        }, 100);
      }
    }
  }, [isSignedIn, isLoaded, role, roleLoading, segments, router, isNavigatorReady]);

  // Always render Stack first - don't block on loading
  // This ensures the navigator is mounted before we try to navigate
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
    <ClerkProvider {...clerkConfig}>
      <RootLayoutNav />
      <StatusBar style="auto" />
    </ClerkProvider>
  );
}

