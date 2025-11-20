import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { roleService, UserRole } from '@/services/roleService';

export function useUserRole() {
  const { user, isLoaded } = useUser();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) {
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        // First, check Clerk public metadata (instant, no network call)
        if (user.publicMetadata?.role) {
          const metadataRole = user.publicMetadata.role as UserRole;
          console.log('Role from Clerk metadata:', metadataRole);
          setRole(metadataRole);
          setLoading(false);
          return;
        }

        // If not in metadata, fetch from Firebase (with timeout)
        const timeoutPromise = new Promise<UserRole | null>((resolve) =>
          setTimeout(() => {
            console.log('Role fetch timeout, defaulting to "user"');
            resolve('user'); // Default to user on timeout
          }, 2000)
        );
        
        const userRole = await Promise.race([
          roleService.getUserRole(user.id, user),
          timeoutPromise
        ]);
        
        // Default to "user" if role is null
        setRole(userRole || 'user');
      } catch (error) {
        console.error('Error fetching user role (non-blocking):', error);
        // Default to "user" if both fail
        setRole('user');
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user, isLoaded]);

  return { role, loading, userId: user?.id };
}

