import type { JSX } from "react";
import Stack from "expo-router/stack";

export default function ProfileStack(): JSX.Element {
  return <Stack screenOptions={{ headerShown: false }} />;
}
