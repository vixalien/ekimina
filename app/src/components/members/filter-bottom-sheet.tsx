import { BottomSheet, Button, Radio, RadioGroup, Separator, Surface } from "heroui-native";
import { Fragment, startTransition, type JSX } from "react";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { AppText } from "../ui/app-text";

export type FilterKey = "all" | "unpaid" | "has_loan" | "penalty";

export const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unpaid", label: "Unpaid" },
  { key: "has_loan", label: "Has loan" },
  { key: "penalty", label: "Penalty" },
];

export const FILTER_LABELS: Record<FilterKey, string> = {
  all: "All",
  unpaid: "Unpaid",
  has_loan: "Has loan",
  penalty: "Penalty",
};

interface FilterBottomSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilter: FilterKey;
  onSelectFilter: (key: FilterKey) => void;
}

export function FilterBottomSheet({
  isOpen,
  onOpenChange,
  activeFilter,
  onSelectFilter,
}: FilterBottomSheetProps): JSX.Element {
  function handleApply(filter: FilterKey) {
    onSelectFilter(filter);
    onOpenChange(false);
  }

  function handleReset() {
    onSelectFilter("all");
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
            <BottomSheet.Title>Filter members</BottomSheet.Title>
          </View>

          <View className="mt-4 mb-6">
            <Surface variant="secondary">
              <RadioGroup
                value={activeFilter}
                onValueChange={(val) => handleApply(val as FilterKey)}
              >
                {FILTER_OPTIONS.map((opt, index) => (
                  <Fragment key={opt.key}>
                    {index > 0 && <Separator />}
                    <RadioGroup.Item value={opt.key}>
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

          <Button variant="primary" onPress={handleReset} isDisabled={activeFilter === "all"}>
            <Button.Label>Reset</Button.Label>
          </Button>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
