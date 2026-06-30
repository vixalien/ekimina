import { Stack } from "expo-router";

export default function LoanLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[loanId]" />
    </Stack>
  );
}
