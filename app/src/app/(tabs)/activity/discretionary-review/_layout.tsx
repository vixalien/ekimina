import { Stack } from "expo-router";

export default function DiscretionaryReviewLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[requestId]" />
    </Stack>
  );
}
