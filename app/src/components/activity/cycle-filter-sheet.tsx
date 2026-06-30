import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { BottomSheet, Button, Input, TextField, useBottomSheetAwareHandlers } from "heroui-native";
import { type JSX, useState } from "react";
import { Keyboard, View } from "react-native";
import { KeyboardController } from "react-native-keyboard-controller";
import { AppText } from "../ui/app-text";

export interface CycleRange {
  from: number;
  to: number;
}

function CycleInputs({
  fromText,
  toText,
  onFromChange,
  onToChange,
}: {
  fromText: string;
  toText: string;
  onFromChange: (t: string) => void;
  onToChange: (t: string) => void;
}) {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();

  return (
    <View className="gap-4">
      <TextField>
        <AppText className="text-sm text-muted font-medium mb-1.5">From cycle</AppText>
        <Input
          variant="secondary"
          placeholder="e.g. 5"
          value={fromText}
          onChangeText={onFromChange}
          keyboardType="number-pad"
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </TextField>
      <TextField>
        <AppText className="text-sm text-muted font-medium mb-1.5">To cycle</AppText>
        <Input
          variant="secondary"
          placeholder="e.g. 7"
          value={toText}
          onChangeText={onToChange}
          keyboardType="number-pad"
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </TextField>
    </View>
  );
}

interface CycleFilterSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  value: CycleRange | null;
  onValueChange: (range: CycleRange | null) => void;
}

export function CycleFilterSheet({
  isOpen,
  onOpenChange,
  value,
  onValueChange,
}: CycleFilterSheetProps): JSX.Element {
  const [fromText, setFromText] = useState(value ? String(value.from) : "");
  const [toText, setToText] = useState(value ? String(value.to) : "");

  function handleOpenChange(open: boolean) {
    if (open) {
      setFromText(value ? String(value.from) : "");
      setToText(value ? String(value.to) : "");
    }
    onOpenChange(open);
  }

  function handleApply() {
    Keyboard.dismiss();
    const from = parseInt(fromText, 10);
    const to = parseInt(toText, 10);
    if (!isNaN(from) && !isNaN(to) && from >= 1 && to >= from) {
      onValueChange({ from, to });
    }
    onOpenChange(false);
  }

  function handleClear() {
    Keyboard.dismiss();
    setFromText("");
    setToText("");
    onValueChange(null);
    onOpenChange(false);
  }

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={handleOpenChange}>
      <BottomSheet.Trigger asChild>
        <View />
      </BottomSheet.Trigger>
      <BottomSheet.Portal>
        <BottomSheet.Overlay onPress={() => KeyboardController.dismiss()} />
        <BottomSheet.Content onClose={() => KeyboardController.dismiss()}>
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="pb-safe-offset-3"
          >
            <BottomSheet.Title>Filter by cycle</BottomSheet.Title>
            <View className="mt-4 gap-2">
              <CycleInputs
                fromText={fromText}
                toText={toText}
                onFromChange={setFromText}
                onToChange={setToText}
              />
              <View className="mt-4 gap-2">
                <Button variant="primary" onPress={handleApply}>
                  <Button.Label>Apply</Button.Label>
                </Button>
                <Button
                  variant="ghost"
                  onPress={handleClear}
                  isDisabled={!fromText && !toText && value === null}
                >
                  <Button.Label>Clear</Button.Label>
                </Button>
              </View>
            </View>
          </BottomSheetScrollView>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
