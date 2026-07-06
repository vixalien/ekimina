import type { JSX, ReactNode } from "react";

import { LinearGradient } from "expo-linear-gradient";
import { Button, ScrollShadow } from "heroui-native";
import { View, ScrollView } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

import { AppText } from "./app-text";
import { Header } from "./header";
import { ScreenContainer } from "./screen-container";
import { StepProgress } from "./step-progress";

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
    <ScreenContainer>
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        {hasHeader && (
          <Header
            canGoBack={showBack}
            title={
              step !== undefined && totalSteps !== undefined ? (
                <StepProgress currentStep={step} totalSteps={totalSteps} />
              ) : undefined
            }
          />
        )}

        <View className="flex-1 px-6">
          <View className="gap-2 pt-4">
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
