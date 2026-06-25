import type { JSX } from "react";
import { View } from "react-native";
import {
  Description,
  FieldError,
  InputGroup,
  Label,
  TextField,
  useBottomSheetAwareHandlers,
} from "heroui-native";
import { AppText } from "../ui/app-text";
import type { GroupSettings } from "../../api/types";

interface MoneySettingsProps {
  value: Pick<GroupSettings, "contributionAmount" | "cycleLength" | "payoutAmount">;
  onChange: (partial: Partial<GroupSettings>) => void;
}

export function MoneySettings({ value, onChange }: MoneySettingsProps): JSX.Element {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();

  const payoutExceeds =
    value.payoutAmount > 0 &&
    value.contributionAmount > 0 &&
    value.payoutAmount >= value.contributionAmount;

  return (
    <View className="gap-5 pb-4">
      <TextField isRequired>
        <Label>Contribution amount</Label>
        <InputGroup>
          <InputGroup.Input
            placeholder="5000"
            value={value.contributionAmount ? String(value.contributionAmount) : ""}
            onChangeText={(t: string) => onChange({ contributionAmount: parseInt(t, 10) || 0 })}
            keyboardType="numeric"
            onFocus={onFocus}
            onBlur={onBlur}
          />
          <InputGroup.Suffix>
            <AppText className="text-sm text-muted">RWF</AppText>
          </InputGroup.Suffix>
        </InputGroup>
      </TextField>

      <TextField isRequired>
        <Label>Cycle length</Label>
        <InputGroup>
          <InputGroup.Input
            placeholder="30"
            value={value.cycleLength ? String(value.cycleLength) : ""}
            onChangeText={(t: string) => onChange({ cycleLength: parseInt(t, 10) || 0 })}
            keyboardType="numeric"
            onFocus={onFocus}
            onBlur={onBlur}
          />
          <InputGroup.Suffix>
            <AppText className="text-sm text-muted">days</AppText>
          </InputGroup.Suffix>
        </InputGroup>
      </TextField>

      <TextField isRequired isInvalid={payoutExceeds}>
        <Label>Payout amount</Label>
        <InputGroup>
          <InputGroup.Input
            placeholder="50000"
            value={value.payoutAmount ? String(value.payoutAmount) : ""}
            onChangeText={(t: string) => onChange({ payoutAmount: parseInt(t, 10) || 0 })}
            keyboardType="numeric"
            onFocus={onFocus}
            onBlur={onBlur}
          />
          <InputGroup.Suffix>
            <AppText className="text-sm text-muted">RWF</AppText>
          </InputGroup.Suffix>
        </InputGroup>
        {payoutExceeds && <FieldError>Payout must be less than the contribution amount</FieldError>}
      </TextField>

      <Description>
        A payout below the total contributions per cycle builds the group reserve automatically. The
        reserve covers future payouts and absorbs defaults.
      </Description>
    </View>
  );
}
