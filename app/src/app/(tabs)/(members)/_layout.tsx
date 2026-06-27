import type { JSX } from "react";
import Stack from "expo-router/stack";

export default function MembersStack(): JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[userId]" />
    </Stack>
  );
}
