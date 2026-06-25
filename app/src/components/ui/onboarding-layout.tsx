import type { JSX, ReactNode } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { Button, ScrollShadow } from "heroui-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { withUniwind } from "uniwind";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { AppText } from "./app-text";
import { ScreenContainer } from "./screen-container";

const StyledIonicons = withUniwind(Ionicons);

interface OnboardingLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  buttonLabel: string;
  onButtonPress: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  showBack?: boolean;
}

export function OnboardingLayout({
  title,
  description,
  children,
  buttonLabel,
  onButtonPress,
  isLoading,
  isDisabled,
  showBack = true,
}: OnboardingLayoutProps): JSX.Element {
  return (
    <ScreenContainer extraTop={showBack ? 12 : 0}>
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={showBack ? 12 : 0}
        className="flex-1"
      >
        <View className="flex-1 px-6">
          {showBack && (
            <Pressable onPress={() => router.back()} className="p-2 -ml-2 self-start mb-4">
              <StyledIonicons name="chevron-back" size={22} className="text-foreground" />
            </Pressable>
          )}

          <View className="gap-2">
            <AppText className="text-2xl font-bold text-foreground">{title}</AppText>
            {description && <AppText className="text-sm text-muted">{description}</AppText>}
          </View>

          <ScrollShadow className="flex-1 pt-6 pb-4" LinearGradientComponent={LinearGradient}>
            <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
          </ScrollShadow>

          <View className="pb-4">
            <Button variant="primary" isDisabled={isDisabled || isLoading} onPress={onButtonPress}>
              <Button.Label>{isLoading ? `${buttonLabel}...` : buttonLabel}</Button.Label>
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
