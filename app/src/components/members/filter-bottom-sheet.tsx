import { BottomSheet, Chip } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";

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
  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Trigger asChild>
        <View />
      </BottomSheet.Trigger>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          detached={true}
          bottomInset={12}
          className="mx-4"
          backgroundClassName="rounded-3xl"
          contentContainerClassName="pb-4"
        >
          <View className="px-2 pt-2 pb-4 gap-4">
            <BottomSheet.Title>Filter members</BottomSheet.Title>
            <BottomSheet.Description>
              Show members matching a specific status
            </BottomSheet.Description>
            <View className="flex-row flex-wrap gap-2 pt-2">
              {FILTER_OPTIONS.map((opt) => {
                const isActive = activeFilter === opt.key;
                return (
                  <Chip
                    key={opt.key}
                    size="md"
                    variant={isActive ? "primary" : "soft"}
                    color={isActive ? "accent" : "default"}
                    onPress={() => {
                      onSelectFilter(opt.key);
                      onOpenChange(false);
                    }}
                  >
                    <Chip.Label>{opt.label}</Chip.Label>
                  </Chip>
                );
              })}
            </View>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
