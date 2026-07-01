import { Stack } from "expo-router";
import type { JSX } from "react";

export default function HomeLayout(): JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="reserve" />
    </Stack>
  );
}
