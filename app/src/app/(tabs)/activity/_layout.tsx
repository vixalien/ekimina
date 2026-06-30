import { Stack } from "expo-router";

export default function ActivityLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="transactions" />
      <Stack.Screen name="[transactionId]" />
      <Stack.Screen name="review" />
      <Stack.Screen name="loan" />
      <Stack.Screen name="loan-review" />
    </Stack>
  );
}
