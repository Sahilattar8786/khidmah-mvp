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
        // Add timeout to prevent hanging (reduced to 2 seconds)
        const timeoutPromise = new Promise<UserRole | null>((resolve) =>
          setTimeout(() => {
            console.log('Role fetch timeout, defaulting to "user"');
            resolve('user'); // Default to user on timeout
          }, 2000)
        );
        
        const userRole = await Promise.race([
          roleService.getUserRole(user.id),
          timeoutPromise
        ]);
        
        // Default to "user" if role is null
        setRole(userRole || 'user');
      } catch (error) {
        console.error('Error fetching user role (non-blocking):', error);
        // Default to "user" if Firebase fails
        setRole('user');
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user, isLoaded]);

  return { role, loading, userId: user?.id };
}

