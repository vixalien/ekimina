import type { JSX } from "react";

import type { GroupSettings } from "@/api";

import {
  ControlField,
  Description,
  InputGroup,
  Label,
  Slider,
  Tabs,
  TextField,
  useBottomSheetAwareHandlers,
} from "heroui-native";
import { View } from "react-native";

import { AppText } from "../ui/app-text";

const THRESHOLD_OPTIONS = [
  { value: "0.5", label: "1 of 2", num: 0.5 },
  { value: "0.66", label: "2 of 3", num: 0.66 },
  { value: "1", label: "All", num: 1 },
] as const;

interface RulesSettingsProps {
  value: Pick<
    GroupSettings,
    "penaltyRate" | "approvalThreshold" | "allMembersAreCommittee" | "committeeSize"
  >;
  onChange: (partial: Partial<GroupSettings>) => void;
}

export function RulesSettings({ value, onChange }: RulesSettingsProps): JSX.Element {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();
  const thresholdStr = String(value.approvalThreshold);

  return (
    <View className="gap-6">
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Label>Penalty rate</Label>
          <AppText className="text-sm font-semibold text-foreground">{value.penaltyRate}%</AppText>
        </View>
        <Slider
          defaultValue={value.penaltyRate}
          onChange={(v) => onChange({ penaltyRate: Math.round(v as number) })}
          minValue={0}
          maxValue={30}
          step={1}
        >
          <Slider.Track>
            <Slider.Fill />
            <Slider.Thumb />
          </Slider.Track>
        </Slider>
      </View>

      <View className="gap-2">
        <Label>Approval threshold</Label>
        <Tabs
          value={thresholdStr}
          onValueChange={(v) => {
            const opt = THRESHOLD_OPTIONS.find((o) => o.value === v);
            if (opt) onChange({ approvalThreshold: opt.num });
          }}
          variant="primary"
        >
          <Tabs.List>
            <Tabs.Indicator />
            {THRESHOLD_OPTIONS.map((opt) => (
              <Tabs.Trigger key={opt.value} value={opt.value} className="flex-1">
                <Tabs.Label>{opt.label}</Tabs.Label>
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </Tabs>
      </View>

      <ControlField
        isSelected={value.allMembersAreCommittee}
        onSelectedChange={(v) => {
          onChange({
            allMembersAreCommittee: v,
            ...(v ? { committeeSize: 0 } : {}),
          });
        }}
      >
        <View className="flex-1">
          <Label>All members are committee</Label>
          <Description>Every member gets committee privileges</Description>
        </View>
        <ControlField.Indicator />
      </ControlField>

      {!value.allMembersAreCommittee && (
        <TextField isRequired>
          <Label>Committee size</Label>
          <InputGroup>
            <InputGroup.Input
              placeholder="3"
              value={value.committeeSize ? String(value.committeeSize) : ""}
              onChangeText={(t: string) => onChange({ committeeSize: parseInt(t, 10) || 0 })}
              keyboardType="numeric"
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </InputGroup>
        </TextField>
      )}
    </View>
  );
}
