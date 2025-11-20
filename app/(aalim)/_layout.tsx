import { Stack } from 'expo-router';

export default function AalimLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="chat/[chatId]" />
    </Stack>
  );
}

