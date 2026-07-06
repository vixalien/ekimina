import type { JSX } from "react";

import { BottomSheet, Button, TextArea, Label } from "heroui-native";
import { useState } from "react";
import { View } from "react-native";

interface RejectReasonSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

export function RejectReasonSheet({
  isOpen,
  onOpenChange,
  onConfirm,
  isLoading,
}: RejectReasonSheetProps): JSX.Element {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason.trim());
    setReason("");
  };

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Trigger asChild>{null}</BottomSheet.Trigger>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          <BottomSheet.Title>Reject loan request</BottomSheet.Title>
          <BottomSheet.Description>
            Optionally provide a reason for rejecting this request.
          </BottomSheet.Description>
          <View className="gap-2 mt-4">
            <Label>Reason (optional)</Label>
            <TextArea
              placeholder="e.g. Borrower has outstanding obligations..."
              value={reason}
              onChangeText={setReason}
              numberOfLines={3}
            />
          </View>
          <View className="flex-row gap-3 mt-6">
            <View className="flex-1">
              <Button variant="tertiary" onPress={() => onOpenChange(false)} isDisabled={isLoading}>
                <Button.Label>Cancel</Button.Label>
              </Button>
            </View>
            <View className="flex-1">
              <Button variant="danger" onPress={handleConfirm} isDisabled={isLoading}>
                <Button.Label>{isLoading ? "Rejecting..." : "Reject"}</Button.Label>
              </Button>
            </View>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
