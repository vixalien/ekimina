import { BottomSheet, Radio, RadioGroup, Separator, Surface } from "heroui-native";
import { Fragment, type JSX } from "react";
import { View } from "react-native";
import type { TransactionType } from "../../api/types";
import { TRANSACTION_TYPE_LABELS } from "../../lib/activity-constants";
import { AppText } from "../ui/app-text";

type TypeFilterValue = "all" | TransactionType;

const TYPE_OPTIONS: { value: TypeFilterValue; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "contribution", label: TRANSACTION_TYPE_LABELS.contribution },
  { value: "payout", label: TRANSACTION_TYPE_LABELS.payout },
  { value: "penalty", label: TRANSACTION_TYPE_LABELS.penalty },
  { value: "loan_repayment", label: TRANSACTION_TYPE_LABELS.loan_repayment },
  { value: "loan_disbursement", label: TRANSACTION_TYPE_LABELS.loan_disbursement },
  { value: "discretionary_deposit", label: TRANSACTION_TYPE_LABELS.discretionary_deposit },
  { value: "discretionary_withdrawal", label: TRANSACTION_TYPE_LABELS.discretionary_withdrawal },
];

interface TypeFilterSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  value: TypeFilterValue;
  onValueChange: (value: TypeFilterValue) => void;
}

export function TypeFilterSheet({
  isOpen,
  onOpenChange,
  value,
  onValueChange,
}: TypeFilterSheetProps): JSX.Element {
  function handleSelect(val: string) {
    onValueChange(val as TypeFilterValue);
    onOpenChange(false);
  }

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Trigger asChild>
        <View />
      </BottomSheet.Trigger>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content contentContainerClassName="pb-12">
          <View className="px-2 pt-2">
            <BottomSheet.Title>Filter by type</BottomSheet.Title>
          </View>
          <View className="mt-4 mb-2">
            <Surface variant="secondary">
              <RadioGroup value={value} onValueChange={handleSelect}>
                {TYPE_OPTIONS.map((opt, index) => (
                  <Fragment key={opt.value}>
                    {index > 0 && <Separator />}
                    <RadioGroup.Item value={opt.value}>
                      {() => (
                        <View className="flex-row items-center justify-between flex-1">
                          <AppText>{opt.label}</AppText>
                          <Radio>
                            <Radio.Indicator />
                          </Radio>
                        </View>
                      )}
                    </RadioGroup.Item>
                  </Fragment>
                ))}
              </RadioGroup>
            </Surface>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

export type { TypeFilterValue };
