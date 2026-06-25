import type { ComponentType, JSX } from "react";
import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { BottomSheet, Button } from "heroui-native";
import { useStore } from "@nanostores/react";
import { nav } from "@/lib/nav";
import { api } from "@/api";
import type { GroupSettings } from "@/api/types";
import { AppText } from "@/components/ui/app-text";
import { WizardLayout } from "@/components/ui/wizard-layout";
import { BasicsSettings } from "@/components/group-settings/basics";
import { MoneySettings } from "@/components/group-settings/money";
import { RulesSettings } from "@/components/group-settings/rules";
import { LoansSettings } from "@/components/group-settings/loans";
import { SettingsReviewList } from "@/components/group-settings/review";
import type { ReviewSection } from "@/components/group-settings/review";
import { $group, updateSettings } from "@/stores/group";
import { $isSubmitting, $submitError } from "@/stores/create-group";

type SectionConfig = {
  title: string;
  keys: (keyof GroupSettings)[];
  Component: ComponentType<{
    value: any;
    onChange: (partial: Partial<GroupSettings>) => void;
  }>;
};

const SECTION_MAP: Record<ReviewSection, SectionConfig> = {
  basics: {
    title: "Basics",
    keys: ["name", "isPublic"],
    Component: BasicsSettings,
  },
  money: {
    title: "Money",
    keys: ["contributionAmount", "cycleLength", "payoutAmount"],
    Component: MoneySettings,
  },
  rules: {
    title: "Rules",
    keys: ["penaltyRate", "approvalThreshold", "allMembersAreCommittee", "committeeSize"],
    Component: RulesSettings,
  },
  loans: {
    title: "Loans",
    keys: ["loansEnabled", "loanInterestRate", "discretionaryFundEnabled"],
    Component: LoansSettings,
  },
};

export default function CreateGroupStep6(): JSX.Element {
  const group = useStore($group);
  const isSubmitting = useStore($isSubmitting);
  const submitError = useStore($submitError);

  const [editingSection, setEditingSection] = useState<ReviewSection | null>(null);

  const settings = group.settings as GroupSettings;

  const isValid = useMemo(() => {
    return !!(
      settings.name?.trim() &&
      settings.contributionAmount > 0 &&
      settings.cycleLength > 0 &&
      settings.payoutAmount > 0 &&
      (settings.allMembersAreCommittee || settings.committeeSize > 0)
    );
  }, [settings]);

  const handleCreate = useCallback(async () => {
    if (!isValid) return;
    $isSubmitting.set(true);
    $submitError.set(null);
    try {
      const result = await api.groups.createGroup({
        settings,
        founderId: "current-user",
      });
      const { $createdGroup } = await import("@/stores/create-group");
      $createdGroup.set({
        id: result.group.id,
        name: result.group.name,
        inviteCode: result.inviteCode,
      });
      nav.replace("/(onboarding)/create-group/success");
    } catch (e) {
      $submitError.set(e instanceof Error ? e.message : "Failed to create group");
    } finally {
      $isSubmitting.set(false);
    }
  }, [settings, isValid]);

  const handleItemPress = useCallback((section: ReviewSection) => {
    setEditingSection(section);
  }, []);

  const activeSection = editingSection ? SECTION_MAP[editingSection] : null;
  const ActiveComponent = activeSection?.Component;

  return (
    <WizardLayout
      step={6}
      totalSteps={6}
      title="Review your group"
      description="You can change any of these later with committee approval once members join"
      buttonLabel={isSubmitting ? "Creating..." : "Create group"}
      onButtonPress={handleCreate}
      isLoading={isSubmitting}
      isDisabled={!isValid || isSubmitting}
    >
      <SettingsReviewList settings={settings} onItemPress={handleItemPress} />

      {submitError && (
        <AppText className="text-sm text-red-500 mt-4 text-center">{submitError}</AppText>
      )}

      <BottomSheet
        isOpen={editingSection !== null}
        onOpenChange={(open) => {
          if (!open) setEditingSection(null);
        }}
      >
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content keyboardBehavior="extend">
            <BottomSheet.Title>{activeSection?.title ?? ""}</BottomSheet.Title>
            <View className="mt-4 mb-6">
              {ActiveComponent && activeSection && (
                <ActiveComponent
                  value={Object.fromEntries(activeSection.keys.map((k) => [k, settings[k]]))}
                  onChange={updateSettings}
                />
              )}
            </View>
            <Button onPress={() => setEditingSection(null)}>
              <Button.Label>Done</Button.Label>
            </Button>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </WizardLayout>
  );
}
