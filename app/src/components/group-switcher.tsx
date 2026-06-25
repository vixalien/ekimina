import type { JSX } from "react";
import { View, Pressable } from "react-native";
import { BottomSheet } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { withUniwind } from "uniwind";
import type { GroupMembership } from "../api/types";
import { AppText } from "./ui/app-text";

const StyledIonicons = withUniwind(Ionicons);

interface GroupSwitcherProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  memberships: GroupMembership[];
  activeGroupId?: string;
  onSelectGroup: (membership: GroupMembership) => void;
  onJoinOrCreate: () => void;
}

export function GroupSwitcher({
  isOpen,
  onOpenChange,
  memberships,
  activeGroupId,
  onSelectGroup,
  onJoinOrCreate,
}: GroupSwitcherProps): JSX.Element {
  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          <BottomSheet.Title>Your groups</BottomSheet.Title>

          <View className="gap-1 mt-4">
            {memberships.map((m) => {
              const isActive = m.group.id === activeGroupId;
              return (
                <Pressable
                  key={m.group.id}
                  onPress={() => {
                    onSelectGroup(m);
                    onOpenChange(false);
                  }}
                >
                  <View
                    className={`flex-row items-center gap-3 p-3 rounded-xl ${
                      isActive ? "bg-accent/10" : ""
                    }`}
                  >
                    <View className="size-10 rounded-full bg-accent/10 items-center justify-center">
                      <AppText className="text-sm font-bold text-accent">
                        {m.group.avatarInitials}
                      </AppText>
                    </View>
                    <View className="flex-1 gap-0.5">
                      <AppText className="text-base font-semibold text-foreground">
                        {m.group.name}
                      </AppText>
                      <AppText className="text-xs text-muted capitalize">{m.role}</AppText>
                    </View>
                    {isActive && (
                      <StyledIonicons
                        name="checkmark-circle"
                        size={22}
                        className="text-foreground"
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View className="mt-4 pt-4 border-t border-border">
            <Pressable onPress={onJoinOrCreate}>
              <View className="flex-row items-center gap-3 p-3">
                <View className="size-10 rounded-full bg-surface-secondary items-center justify-center">
                  <StyledIonicons name="add" size={20} className="text-muted" />
                </View>
                <AppText className="text-base text-muted">Join or create another group</AppText>
              </View>
            </Pressable>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
