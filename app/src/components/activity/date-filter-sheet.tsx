import { BottomSheet, Radio, RadioGroup, Separator, Surface } from "heroui-native";
import { Fragment, type JSX } from "react";
import { View } from "react-native";

import { AppText } from "../ui/app-text";

export type DatePreset = "all" | "this_week" | "this_month" | "last_30";

const DATE_OPTIONS: { value: DatePreset; label: string }[] = [
  { value: "all", label: "Any date" },
  { value: "this_week", label: "This week" },
  { value: "this_month", label: "This month" },
  { value: "last_30", label: "Last 30 days" },
];

interface DateFilterSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  value: DatePreset;
  onValueChange: (value: DatePreset) => void;
}

export function DateFilterSheet({
  isOpen,
  onOpenChange,
  value,
  onValueChange,
}: DateFilterSheetProps): JSX.Element {
  function handleSelect(val: string) {
    onValueChange(val as DatePreset);
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
            <BottomSheet.Title>Filter by date</BottomSheet.Title>
          </View>
          <View className="mt-4 mb-2">
            <Surface variant="secondary">
              <RadioGroup value={value} onValueChange={handleSelect}>
                {DATE_OPTIONS.map((opt, index) => (
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

export const DATE_LABELS: Record<DatePreset, string> = {
  all: "Any date",
  this_week: "This week",
  this_month: "This month",
  last_30: "Last 30 days",
};
