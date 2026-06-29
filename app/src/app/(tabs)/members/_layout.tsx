import { Stack } from "expo-router";

export default function MembersLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: "All Members" }} />
      <Stack.Screen name="[userId]" options={{ title: "Member Profile" }} />
    </Stack>
  );
}
