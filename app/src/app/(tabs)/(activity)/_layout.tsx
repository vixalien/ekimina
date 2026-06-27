import type { JSX } from "react";
import Stack from "expo-router/stack";

export default function ActivityStack(): JSX.Element {
  return <Stack screenOptions={{ headerShown: false }} />;
}
