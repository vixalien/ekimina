import type { JSX } from "react";
import { useEffect } from "react";
import { View } from "react-native";
import { router } from "expo-router";

export default function Index(): JSX.Element {
  useEffect(() => {
    router.replace("/(onboarding)/phone" as any);
  }, []);

  return <View />;
}
