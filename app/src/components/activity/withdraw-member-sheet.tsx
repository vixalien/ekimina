import type { JSX } from "react";

import { BottomSheet, Button, Radio, RadioGroup, Label, Separator } from "heroui-native";
import { useState } from "react";
import { View } from "react-native";

const REASON_CATEGORIES = ["Repeated default", "Misconduct", "Voluntary withdrawal", "Other"];

interface WithdrawMemberSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reasonCategory: string) => void;
  isLoading?: boolean;
}

export function WithdrawMemberSheet({
  isOpen,
  onOpenChange,
  onConfirm,
  isLoading,
}: WithdrawMemberSheetProps): JSX.Element {
  const [reasonCategory, setReasonCategory] = useState("Repeated default");

  const handleConfirm = () => {
    onConfirm(reasonCategory);
  };

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Trigger asChild>{null}</BottomSheet.Trigger>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          <BottomSheet.Title>Withdraw member</BottomSheet.Title>
          <BottomSheet.Description>
            Select a reason for withdrawing this member. This will require committee approval.
          </BottomSheet.Description>
          <View className="gap-3 mt-4">
            <Label>
              <Label.Text>Reason category</Label.Text>
            </Label>
            <RadioGroup value={reasonCategory} onValueChange={setReasonCategory}>
              {REASON_CATEGORIES.map((rc, index) => (
                <View key={rc}>
                  {index > 0 && <Separator className="my-3" />}
                  <RadioGroup.Item value={rc}>
                    <Radio />
                    <View className="flex-1">
                      <Label>
                        <Label.Text>{rc}</Label.Text>
                      </Label>
                    </View>
                  </RadioGroup.Item>
                </View>
              ))}
            </RadioGroup>
          </View>
          <View className="flex-row gap-3 mt-6">
            <View className="flex-1">
              <Button variant="tertiary" onPress={() => onOpenChange(false)} isDisabled={isLoading}>
                <Button.Label>Cancel</Button.Label>
              </Button>
            </View>
            <View className="flex-1">
              <Button variant="danger" onPress={handleConfirm} isDisabled={isLoading}>
                <Button.Label>{isLoading ? "Submitting..." : "Confirm withdrawal"}</Button.Label>
              </Button>
            </View>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
