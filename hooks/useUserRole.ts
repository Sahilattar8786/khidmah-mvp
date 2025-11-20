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
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        
        const userRole = await Promise.race([
          roleService.getUserRole(user.id),
          timeoutPromise
        ]) as UserRole | null;
        
        setRole(userRole);
      } catch (error) {
        console.error('Error fetching user role:', error);
        // If Firebase is not configured or times out, set role to null and continue
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user, isLoaded]);

  return { role, loading, userId: user?.id };
}

