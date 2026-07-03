import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheet,
  Button,
  ControlField,
  Description,
  InputGroup,
  Label,
  Slider,
  Tabs,
  TextField,
  useBottomSheetAwareHandlers,
} from "heroui-native";
import type { JSX } from "react";
import { useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import { withUniwind } from "uniwind";

import type { GroupSettingField } from "@/api";
import { AppText } from "@/components/ui/app-text";

const StyledIonicons = withUniwind(Ionicons);

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  field: GroupSettingField;
  fieldLabel: string;
  currentValue: string;
  rawValue?: number | boolean | string;
  isCommitteeMember: boolean;
  approvalThreshold: number;
  committeeSize: number;
  onSubmit: (proposedValue: string) => void;
}

function NumberInputContent({
  field,
  value,
  onChange,
}: {
  field: GroupSettingField;
  value: string;
  onChange: (v: string) => void;
}): JSX.Element {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();

  const unit =
    field === "contribution_amount" || field === "payout_amount"
      ? "RWF"
      : field === "cycle_length"
        ? "days"
        : "";

  return (
    <TextField isRequired>
      <InputGroup>
        <InputGroup.Input
          placeholder="0"
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {unit ? (
          <InputGroup.Suffix>
            <AppText className="text-sm text-muted">{unit}</AppText>
          </InputGroup.Suffix>
        ) : null}
      </InputGroup>
    </TextField>
  );
}

function SliderContent({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}): JSX.Element {
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <AppText className="text-sm text-muted">Rate</AppText>
        <AppText className="text-lg font-semibold text-foreground">{value}%</AppText>
      </View>
      <Slider
        defaultValue={value}
        onChange={(v) => onChange(Math.round(v as number))}
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
  );
}

function ToggleNumberContent({
  toggleLabel,
  toggleDescription,
  toggleValue,
  onToggleChange,
  numberValue,
  onNumberChange,
  numberLabel,
  numberUnit,
}: {
  toggleLabel: string;
  toggleDescription: string;
  toggleValue: boolean;
  onToggleChange: (v: boolean) => void;
  numberValue: string;
  onNumberChange: (v: string) => void;
  numberLabel: string;
  numberUnit?: string;
}): JSX.Element {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();

  return (
    <View className="gap-4">
      <ControlField isSelected={toggleValue} onSelectedChange={onToggleChange}>
        <View className="flex-1">
          <Label>{toggleLabel}</Label>
          <Description>{toggleDescription}</Description>
        </View>
        <ControlField.Indicator />
      </ControlField>
      {toggleValue && (
        <TextField isRequired>
          <Label>{numberLabel}</Label>
          <InputGroup>
            <InputGroup.Input
              placeholder="0"
              value={numberValue}
              onChangeText={onNumberChange}
              keyboardType="numeric"
              onFocus={onFocus}
              onBlur={onBlur}
            />
            {numberUnit ? (
              <InputGroup.Suffix>
                <AppText className="text-sm text-muted">{numberUnit}</AppText>
              </InputGroup.Suffix>
            ) : null}
          </InputGroup>
        </TextField>
      )}
    </View>
  );
}

const THRESHOLD_OPTIONS = [
  { value: "0.5", label: "1 of 2" },
  { value: "0.66", label: "2 of 3" },
  { value: "1", label: "All" },
] as const;

const POLICY_OPTIONS = [
  { value: "private", label: "Private" },
  { value: "public", label: "Public" },
] as const;

function ApprovalThresholdContent({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}): JSX.Element {
  return (
    <Tabs value={value} onValueChange={onChange} variant="primary">
      <Tabs.List>
        <Tabs.Indicator />
        {THRESHOLD_OPTIONS.map((opt) => (
          <Tabs.Trigger key={opt.value} value={opt.value} className="flex-1">
            <Tabs.Label>{opt.label}</Tabs.Label>
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs>
  );
}

function SegmentedContent({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}): JSX.Element {
  return (
    <Tabs value={value} onValueChange={onChange} variant="primary">
      <Tabs.List>
        <Tabs.Indicator />
        {POLICY_OPTIONS.map((opt) => (
          <Tabs.Trigger key={opt.value} value={opt.value} className="flex-1">
            <Tabs.Label>{opt.label}</Tabs.Label>
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs>
  );
}

function ToggleContent({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}): JSX.Element {
  return (
    <ControlField isSelected={value} onSelectedChange={onChange}>
      <View className="flex-1">
        <Label>Discretionary fund</Label>
        <Description>
          Lets the committee deposit or withdraw group funds directly
        </Description>
      </View>
      <ControlField.Indicator />
    </ControlField>
  );
}

export function SettingsModal({
  isOpen,
  onOpenChange,
  field,
  fieldLabel,
  rawValue,
  isCommitteeMember,
  onSubmit,
}: SettingsModalProps): JSX.Element {
  const [numberInput, setNumberInput] = useState(() => {
    if (typeof rawValue === "number") return String(rawValue);
    return "";
  });
  const [sliderValue, setSliderValue] = useState(
    typeof rawValue === "number" ? rawValue : 15
  );
  const [toggleValue, setToggleValue] = useState(
    typeof rawValue === "boolean" ? rawValue : false
  );
  const [committeeNumber, setCommitteeNumber] = useState(
    field === "committee_size" && typeof rawValue === "number" ? String(rawValue) : "3"
  );
  const [policyValue, setPolicyValue] = useState(
    typeof rawValue === "string" ? rawValue : "private"
  );
  const [thresholdValue, setThresholdValue] = useState(() => {
    if (typeof rawValue === "number") {
      if (rawValue === 0.5) return "0.5";
      if (rawValue >= 1) return "1";
      return "0.66";
    }
    return "0.66";
  });

  const handleSubmit = useCallback(() => {
    let proposed: string;
    switch (field) {
      case "contribution_amount":
      case "cycle_length":
      case "payout_amount":
        proposed = numberInput;
        break;
      case "penalty_rate":
        proposed = String(sliderValue);
        break;
      case "loan_interest_rate":
        proposed = toggleValue ? numberInput : "0";
        break;
      case "committee_size":
        proposed = toggleValue ? "0" : committeeNumber;
        break;
      case "approval_threshold":
        proposed = thresholdValue;
        break;
      case "discretionary_fund":
        proposed = toggleValue ? "enabled" : "disabled";
        break;
      case "group_policy":
        proposed = policyValue;
        break;
      default:
        proposed = numberInput;
    }
    onSubmit(proposed);
  }, [field, numberInput, sliderValue, toggleValue, committeeNumber, thresholdValue, policyValue, onSubmit]);

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <AppText className="text-lg font-semibold text-foreground">{fieldLabel}</AppText>
            <Pressable onPress={() => onOpenChange(false)} hitSlop={12}>
              <StyledIonicons name="close" size={22} className="text-muted" />
            </Pressable>
          </View>

          {/* Content area */}
          {field === "contribution_amount" ||
          field === "cycle_length" ||
          field === "payout_amount" ? (
            <NumberInputContent
              field={field}
              value={numberInput}
              onChange={setNumberInput}
            />
          ) : field === "penalty_rate" ? (
            <SliderContent value={sliderValue} onChange={setSliderValue} />
          ) : field === "loan_interest_rate" ? (
            <ToggleNumberContent
              toggleLabel="Charge interest on loans"
              toggleDescription="Interest is repaid alongside contributions"
              toggleValue={toggleValue}
              onToggleChange={(v) => setToggleValue(v)}
              numberValue={numberInput}
              onNumberChange={setNumberInput}
              numberLabel="Interest rate"
              numberUnit="% flat"
            />
          ) : field === "committee_size" ? (
            <ToggleNumberContent
              toggleLabel="All members are committee"
              toggleDescription="Every member gets committee signing privileges"
              toggleValue={toggleValue}
              onToggleChange={(v) => setToggleValue(v)}
              numberValue={committeeNumber}
              onNumberChange={setCommitteeNumber}
              numberLabel="Committee size"
            />
          ) : field === "approval_threshold" ? (
            <ApprovalThresholdContent
              value={thresholdValue}
              onChange={setThresholdValue}
            />
          ) : field === "group_policy" ? (
            <SegmentedContent value={policyValue} onChange={setPolicyValue} />
          ) : field === "discretionary_fund" ? (
            <ToggleContent value={toggleValue} onChange={setToggleValue} />
          ) : null}

          {/* Helper note */}
          <AppText className="text-xs text-muted mt-4">
            Changing this setting requires group committee approval.
          </AppText>

          {/* Actions */}
          {isCommitteeMember ? (
            <View className="mt-6 gap-3">
              <Button variant="primary" onPress={handleSubmit}>
                <Button.Label>Submit for approval</Button.Label>
              </Button>
              <Button variant="secondary" onPress={() => onOpenChange(false)}>
                <Button.Label>Cancel</Button.Label>
              </Button>
            </View>
          ) : (
            <View className="mt-4 gap-3">
              <AppText className="text-xs text-muted text-center">
                Only committee members can change this setting.
              </AppText>
              <Button variant="secondary" onPress={() => onOpenChange(false)}>
                <Button.Label>Close</Button.Label>
              </Button>
            </View>
          )}
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
