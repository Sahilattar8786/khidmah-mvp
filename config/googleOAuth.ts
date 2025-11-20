import { roleService } from '@/services/roleService';
import { useOAuth } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';

export const useGoogleOAuth = () => {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const googleOAuth = async () => {
    try {
      // Create redirect URL using app scheme
      // Format: khidmahmvp:///(user)/home
      const redirectUrl = Linking.createURL('/(user)/home');

      console.log('Starting Google OAuth with redirect URL:', redirectUrl);

      const { createdSessionId, setActive, signUp } = await startOAuthFlow({
        redirectUrl,
      });

      if (createdSessionId) {
        if (setActive) {
          await setActive({ session: createdSessionId });

          // Default new Google signups to "user" role
          // Check both signUp and signIn for createdUserId
          const userId = signUp?.createdUserId;
          if (userId) {
            try {
              await roleService.setUserRole(userId, 'user');
            } catch (roleError) {
              console.error('Error setting role:', roleError);
              // Continue even if role setting fails
            }
          }

          return {
            success: true,
            code: 'success',
            message: 'You have successfully signed in with Google',
          };
        }
      }

      return {
        success: false,
        message: 'An error occurred while signing in with Google',
      };
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      
      // More detailed error message
      const errorMessage = err?.errors?.[0]?.longMessage 
        || err?.errors?.[0]?.message 
        || err?.message 
        || 'Failed to sign in with Google';
      
      return {
        success: false,
        code: err?.code || 'unknown_error',
        message: errorMessage,
      };
    }
  };

  return { googleOAuth };
};

