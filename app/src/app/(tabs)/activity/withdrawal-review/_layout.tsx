import { Stack } from "expo-router";

export default function WithdrawalReviewLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[requestId]" />
    </Stack>
  );
}
