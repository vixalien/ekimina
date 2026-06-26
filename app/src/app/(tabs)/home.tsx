import { Redirect } from "expo-router";
import type { JSX } from "react";

export default function HomeTab(): JSX.Element {
  return <Redirect href="/(tabs)" />;
}
