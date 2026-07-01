import { Stack } from "expo-router";

export default function ActivityLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="transactions" />
      <Stack.Screen name="[transactionId]" />
      <Stack.Screen name="discretionary-request" />
      <Stack.Screen name="discretionary-review" />
      <Stack.Screen name="join-review" />
      <Stack.Screen name="withdrawal-review" />
      <Stack.Screen name="loan" />
      <Stack.Screen name="loan-review" />
    </Stack>
  );
}
