import { Stack } from "expo-router";

export default function JoinReviewLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[requestId]" />
    </Stack>
  );
}
