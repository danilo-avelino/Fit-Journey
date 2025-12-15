/// <reference types="nativewind/types" />
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

export default function RootLayout() {
  return (
    <View className="flex-1 bg-teal-950">
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#05161A' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(auth)/signup" />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      </Stack>
    </View>
  );
}