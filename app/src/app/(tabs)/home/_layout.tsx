import type { JSX } from "react";

import { Stack } from "expo-router";

export default function HomeLayout(): JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="reserve" />
    </Stack>
  );
}
