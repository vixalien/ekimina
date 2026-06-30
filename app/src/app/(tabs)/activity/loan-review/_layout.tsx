import { Stack } from "expo-router";

export default function LoanReviewLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[loanId]" />
    </Stack>
  );
}
