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
import { StepProgress } from "./step-progress";

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
  step?: number;
  totalSteps?: number;
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
  step,
  totalSteps,
}: OnboardingLayoutProps): JSX.Element {
  const hasHeader = showBack || step !== undefined;

  return (
    <ScreenContainer extraTop={hasHeader ? 12 : 0}>
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={hasHeader ? 12 : 0}
        className="flex-1"
      >
        <View className="flex-1 px-6">
          {hasHeader && (
            <View className="flex-row items-center mb-4">
              {showBack ? (
                <Pressable onPress={() => router.back()} className="p-2 -ml-2">
                  <StyledIonicons name="chevron-back" size={22} className="text-foreground" />
                </Pressable>
              ) : (
                <View className="w-[38px]" />
              )}

              {step !== undefined && totalSteps !== undefined && (
                <View className="flex-1 items-center">
                  <StepProgress currentStep={step} totalSteps={totalSteps} />
                </View>
              )}

              {showBack && step !== undefined && <View className="w-[38px]" />}
            </View>
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
