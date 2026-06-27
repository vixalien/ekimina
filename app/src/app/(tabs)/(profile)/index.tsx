import type { JSX } from "react";
import { View } from "react-native";
import { AppText } from "../../../components/ui/app-text";

export default function ProfileTab(): JSX.Element {
  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      <AppText className="text-lg font-semibold text-foreground">Profile</AppText>
      <AppText className="text-sm text-muted mt-1">Coming soon</AppText>
    </View>
  );
}
