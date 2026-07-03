import type { JSX } from "react";
import { View } from "react-native";
import {
  ControlField,
  Description,
  InputGroup,
  Label,
  TextField,
  useBottomSheetAwareHandlers,
} from "heroui-native";
import { AppText } from "../ui/app-text";
import type { GroupSettings } from "@/api";

interface LoansSettingsProps {
  value: Pick<GroupSettings, "loansEnabled" | "loanInterestRate" | "discretionaryFundEnabled">;
  onChange: (partial: Partial<GroupSettings>) => void;
}

export function LoansSettings({ value, onChange }: LoansSettingsProps): JSX.Element {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();

  return (
    <View className="gap-6">
      <ControlField
        isSelected={value.loansEnabled}
        onSelectedChange={(v) =>
          onChange({
            loansEnabled: v,
            ...(v ? {} : { loanInterestRate: 0 }),
          })
        }
      >
        <View className="flex-1">
          <Label>Enable loans</Label>
          <Description>Allow members to borrow from the group</Description>
        </View>
        <ControlField.Indicator />
      </ControlField>

      {value.loansEnabled && (
        <TextField isRequired>
          <Label>Loan interest rate</Label>
          <InputGroup>
            <InputGroup.Input
              placeholder="10"
              value={value.loanInterestRate ? String(value.loanInterestRate) : ""}
              onChangeText={(t: string) => onChange({ loanInterestRate: parseInt(t, 10) || 0 })}
              keyboardType="numeric"
              onFocus={onFocus}
              onBlur={onBlur}
            />
            <InputGroup.Suffix>
              <AppText className="text-sm text-muted">percent flat</AppText>
            </InputGroup.Suffix>
          </InputGroup>
          <Description>
            Interest is repaid alongside contributions and flows into the group reserve
          </Description>
        </TextField>
      )}

      <ControlField
        isSelected={value.discretionaryFundEnabled}
        onSelectedChange={(v) => onChange({ discretionaryFundEnabled: v })}
      >
        <View className="flex-1">
          <Label>Enable discretionary fund</Label>
          <Description>
            Lets the committee deposit or withdraw group funds directly, with committee approval
            each time
          </Description>
        </View>
        <ControlField.Indicator />
      </ControlField>
    </View>
  );
}
