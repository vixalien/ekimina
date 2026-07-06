import type { JSX } from "react";

import type { GroupSettings } from "@/api";

import {
  Description,
  InputGroup,
  Label,
  Tabs,
  TextField,
  useBottomSheetAwareHandlers,
} from "heroui-native";
import { View } from "react-native";

interface BasicsSettingsProps {
  value: Pick<GroupSettings, "name" | "isPublic">;
  onChange: (partial: Partial<GroupSettings>) => void;
}

export function BasicsSettings({ value, onChange }: BasicsSettingsProps): JSX.Element {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();

  return (
    <View className="gap-5">
      <TextField isRequired>
        <Label>Group name</Label>
        <InputGroup>
          <InputGroup.Input
            placeholder="e.g. Umugongo W'Abaturage"
            value={value.name}
            onChangeText={(name: string) => onChange({ name })}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </InputGroup>
      </TextField>

      <View className="gap-2">
        <Label>Group policy</Label>
        <Tabs
          value={value.isPublic ? "public" : "private"}
          onValueChange={(v) => onChange({ isPublic: v === "public" })}
          variant="primary"
        >
          <Tabs.List>
            <Tabs.Indicator />
            <Tabs.Trigger value="private" className="flex-1">
              <Tabs.Label>Private</Tabs.Label>
            </Tabs.Trigger>
            <Tabs.Trigger value="public" className="flex-1">
              <Tabs.Label>Public</Tabs.Label>
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs>
        <Description>New members will always need to be approved</Description>
      </View>
    </View>
  );
}
