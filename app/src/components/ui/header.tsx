import type { JSX, ReactNode } from "react";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { withUniwind } from "uniwind";

import { AppText } from "./app-text";

const StyledIonicons = withUniwind(Ionicons);

interface HeaderProps {
  canGoBack?: boolean;
  title?: ReactNode | string;
  options?: ReactNode;
}

export function Header({ canGoBack = true, title, options }: HeaderProps): JSX.Element {
  return (
    <View className="bg-background">
      <View className="flex-row items-center justify-center h-14 px-4">
        <View className="absolute left-4">
          {canGoBack && (
            <Pressable onPress={() => router.back()} className="p-2 -ml-2">
              <StyledIonicons name="chevron-back" size={22} className="text-foreground" />
            </Pressable>
          )}
        </View>

        <View className="items-center justify-center">
          {typeof title === "string" ? (
            <AppText className="text-lg font-semibold text-foreground">{title}</AppText>
          ) : (
            title
          )}
        </View>

        <View className="absolute right-4">{options}</View>
      </View>
    </View>
  );
}
