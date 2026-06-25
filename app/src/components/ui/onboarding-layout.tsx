import type { JSX, ReactNode } from "react";
import { View, Pressable } from "react-native";
import { Button } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { withUniwind } from "uniwind";
import { AppText } from "./app-text";
import { ScreenContainer } from "./screen-container";

const StyledIonicons = withUniwind(Ionicons);

interface OnboardingLayoutProps {
  title: string;
  description?: string;
  onBack?: () => void;
  children: ReactNode;
  buttonLabel: string;
  onButtonPress: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
}

export function OnboardingLayout({
  title,
  description,
  onBack,
  children,
  buttonLabel,
  onButtonPress,
  isLoading,
  isDisabled,
}: OnboardingLayoutProps): JSX.Element {
  return (
    <ScreenContainer extraTop={onBack ? 12 : 0}>
      <View className="flex-1 px-6">
        {onBack && (
          <Pressable
            onPress={onBack}
            className="absolute top-0 left-0 p-2"
          >
            <StyledIonicons
              name="arrow-back"
              size={22}
              className="text-foreground"
            />
          </Pressable>
        )}

        <View className={onBack ? "mt-10" : ""}>
          <AppText className="text-2xl font-bold text-foreground">
            {title}
          </AppText>
          {description && (
            <AppText className="text-sm text-muted mt-1">
              {description}
            </AppText>
          )}
        </View>

        <View className="flex-1 pt-6">
          {children}
        </View>

        <View className="pb-4">
          <Button
            variant="primary"
            isDisabled={isDisabled || isLoading}
            onPress={onButtonPress}
          >
            <Button.Label>
              {isLoading ? `${buttonLabel}...` : buttonLabel}
            </Button.Label>
          </Button>
        </View>
      </View>
    </ScreenContainer>
  );
}
