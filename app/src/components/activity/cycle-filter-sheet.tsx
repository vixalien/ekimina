import { BottomSheet, Button, useBottomSheetAwareHandlers } from "heroui-native";
import { type JSX, useState } from "react";
import { Keyboard, TextInput, View } from "react-native";
import { AppText } from "../ui/app-text";

export interface CycleRange {
  from: number;
  to: number;
}

function CycleInput({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
}) {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();

  return (
    <View className="gap-1.5">
      <AppText className="text-sm text-muted font-medium">{label}</AppText>
      <View className="bg-surface-secondary rounded-xl px-4 py-3">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType="number-pad"
          className="text-base text-foreground font-normal"
          placeholderTextColor="rgba(0,0,0,0.35)"
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </View>
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
        <BottomSheet.Overlay />
        <BottomSheet.Content contentContainerClassName="pb-12" keyboardBehavior="extend">
          <View className="px-2 pt-2">
            <BottomSheet.Title>Filter by cycle</BottomSheet.Title>
          </View>
          <View className="mt-4 gap-3 mb-4">
            <CycleInput
              label="From cycle"
              value={fromText}
              onChangeText={setFromText}
              placeholder="e.g. 5"
            />
            <CycleInput
              label="To cycle"
              value={toText}
              onChangeText={setToText}
              placeholder="e.g. 7"
            />
          </View>
          <View className="gap-2">
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
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
