import type { JSX } from "react";
import { useState } from "react";
import { View, ImageBackground } from "react-native";
import { Button, BottomSheet } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { withUniwind } from "uniwind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { AppText } from "../components/ui/app-text";

const StyledIonicons = withUniwind(Ionicons);

const splashImg = require("../../assets/splash.jpg");

export default function WelcomeScreen(): JSX.Element {
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground source={splashImg} className="flex-1" resizeMode="cover">
      <View className="flex-1 bg-black/40">
        <View className="px-6" style={{ paddingTop: insets.top + 24 }}>
          <AppText className="text-2xl font-bold text-accent">
            e-Kimina
          </AppText>
        </View>

        <View className="flex-1" />

        <View className="px-6 gap-4" style={{ paddingBottom: insets.bottom + 24 }}>
          <AppText className="text-3xl font-semibold text-white leading-tight">
            Cooperative savings, made transparent
          </AppText>

          <Button
            size="sm"
            variant="tertiary"
            onPress={() => setIsDisclaimerOpen(true)}
          >
            <StyledIonicons name="information-circle-outline" size={16} />
            <Button.Label>Disclaimer</Button.Label>
          </Button>

          <Button
            variant="primary"
            onPress={() => router.push("/(onboarding)/phone" as any)}
          >
            <Button.Label>Continue</Button.Label>
          </Button>
        </View>
      </View>

      <BottomSheet isOpen={isDisclaimerOpen} onOpenChange={setIsDisclaimerOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content>
            <BottomSheet.Title>Disclaimer</BottomSheet.Title>
            <View className="gap-4 mt-2">
              <AppText className="text-sm text-muted leading-5">
                e-Kimina is a prototype built for educational purposes as part
                of a university capstone project. It is not a real bank or
                financial institution.
              </AppText>
              <AppText className="text-sm text-muted leading-5">
                This app explores the concept of cooperative savings groups
                (ikimina) using blockchain technology. No real money is
                collected, stored, or managed through this application.
              </AppText>
              <AppText className="text-sm text-muted leading-5">
                Any cryptocurrency interactions shown are simulated for
                demonstration purposes only. Do not send real funds.
              </AppText>
              <Button variant="tertiary" onPress={() => setIsDisclaimerOpen(false)}>
                <Button.Label>Got it</Button.Label>
              </Button>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </ImageBackground>
  );
}
