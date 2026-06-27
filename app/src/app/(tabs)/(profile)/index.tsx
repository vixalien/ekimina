import type { JSX } from "react";
import { View } from "react-native";
import { Header } from "../../../components/ui/header";
import { ScreenContainer } from "../../../components/ui/screen-container";
import { AppText } from "../../../components/ui/app-text";

export default function ProfileTab(): JSX.Element {
  return (
    <ScreenContainer>
      <Header title="Profile" canGoBack={false} />
      <View className="flex-1 items-center justify-center px-6">
        <AppText className="text-sm text-muted mt-1">Coming soon</AppText>
      </View>
    </ScreenContainer>
  );
}
