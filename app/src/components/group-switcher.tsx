import type { GroupMeta } from "@ekimina/types";
import type { JSX } from "react";

import { Ionicons } from "@expo/vector-icons";
import { Avatar, BottomSheet, Button, Radio, RadioGroup } from "heroui-native";
import { View } from "react-native";
import { withUniwind } from "uniwind";

import { AppText } from "./ui/app-text";

const StyledIonicons = withUniwind(Ionicons);

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface GroupSwitcherProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  memberships: GroupMeta[];
  activeGroupId?: string;
  onSelectGroup: (membership: GroupMeta) => void;
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

          <View className="mt-4 mb-2">
            <RadioGroup
              value={activeGroupId}
              onValueChange={(val) => {
                const membership = memberships.find((m) => m.address === val);
                if (membership) onSelectGroup(membership);
                onOpenChange(false);
              }}
            >
              {memberships.map((m) => {
                const isActive = m.address === activeGroupId;
                return (
                  <RadioGroup.Item
                    key={m.address}
                    value={m.address}
                    onPress={() => {
                      if (isActive) onOpenChange(false);
                    }}
                  >
                    {() => (
                      <View className="flex-row items-center gap-3 flex-1">
                        <Avatar size="md" color="accent">
                          <Avatar.Fallback>{initials(m.name)}</Avatar.Fallback>
                        </Avatar>
                        <View className="flex-1 gap-0.5">
                          <AppText className="text-base font-semibold text-foreground">
                            {m.name}
                          </AppText>
                        </View>
                        <Radio>
                          <Radio.Indicator className="border-none shadow-none bg-transparent size-6">
                            {isActive && (
                              <StyledIonicons
                                name="checkmark-circle"
                                size={22}
                                className="text-foreground"
                              />
                            )}
                          </Radio.Indicator>
                        </Radio>
                      </View>
                    )}
                  </RadioGroup.Item>
                );
              })}
            </RadioGroup>
          </View>

          <Button variant="ghost" onPress={onJoinOrCreate} className="mt-2">
            <StyledIonicons name="add" size={20} className="text-accent" />
            <Button.Label className="text-accent">Join or create another group</Button.Label>
          </Button>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
