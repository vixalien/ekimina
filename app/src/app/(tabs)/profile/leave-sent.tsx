import { Ionicons } from "@expo/vector-icons";
import { Button } from "heroui-native";
import { router } from "expo-router";
import type { JSX } from "react";
import { View } from "react-native";
import { withUniwind } from "uniwind";

import { AppText } from "@/components/ui/app-text";
import { ScreenContainer } from "@/components/ui/screen-container";

const StyledIonicons = withUniwind(Ionicons);

export default function LeaveGroupSent(): JSX.Element {
  function handleDone() {
    router.replace("/(tabs)/profile");
  }

  return (
    <ScreenContainer>
      <View className="flex-1 items-center justify-center px-6 gap-6">
        <View className="size-20 items-center justify-center rounded-full bg-info/10">
          <StyledIonicons name="time-outline" size={40} className="text-info" />
        </View>

        <View className="items-center gap-2">
          <AppText className="text-2xl font-semibold text-foreground">Leave request sent</AppText>
          <AppText className="text-base text-muted text-center leading-5">
            The committee will review it. You stay a member until it is approved.
          </AppText>
          <AppText className="text-xs text-muted mt-2">Sent just now</AppText>
        </View>
      </View>

      <View className="px-4 pb-8">
        <Button variant="secondary" onPress={handleDone}>
          <Button.Label>Done</Button.Label>
        </Button>
      </View>
    </ScreenContainer>
  );
}
