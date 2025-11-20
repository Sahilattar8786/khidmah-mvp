import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to login - the root layout will handle auth state and routing
  return <Redirect href="/(auth)/login" />;
}

