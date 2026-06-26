import type { JSX } from "react";
import { Pressable, View } from "react-native";
import { Avatar } from "heroui-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "./ui/app-text";

interface TopBarProps {
  groupName: string;
  userInitials: string;
  onPress: () => void;
}

export function TopBar({ groupName, userInitials, onPress }: TopBarProps): JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top }} className="bg-background border-b border-border">
      <View className="flex-row items-center justify-between px-4 h-14">
        <Pressable onPress={onPress} className="shrink mr-3 flex-1">
          <AppText className="text-lg font-semibold text-foreground" numberOfLines={1}>
            {groupName || "e-Kimina"}
          </AppText>
        </Pressable>
        <Pressable onPress={onPress}>
          <Avatar size="sm" color="accent">
            <Avatar.Fallback>{userInitials}</Avatar.Fallback>
          </Avatar>
        </Pressable>
      </View>
    </View>
  );
}
