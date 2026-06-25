import type { JSX } from "react";
import { useStore } from "@nanostores/react";
import { nav } from "@/lib/nav";
import { WizardLayout } from "@/components/ui/wizard-layout";
import { RulesSettings } from "@/components/group-settings/rules";
import { $group, updateSettings } from "@/stores/group";
import { setStep } from "@/stores/create-group";

export default function CreateGroupStep4(): JSX.Element {
  const group = useStore($group);
  const settings = group.settings;

  const penaltyRate = settings.penaltyRate ?? 0;
  const approvalThreshold = settings.approvalThreshold ?? 0.5;
  const allMembersAreCommittee = settings.allMembersAreCommittee ?? false;
  const committeeSize = settings.committeeSize ?? 0;

  const isValid = allMembersAreCommittee || committeeSize > 0;

  function handleNext() {
    setStep(5);
    nav.push("/(onboarding)/create-group/step-5");
  }

  return (
    <WizardLayout
      step={4}
      totalSteps={6}
      title="Rules"
      buttonLabel="Next"
      onButtonPress={handleNext}
      isDisabled={!isValid}
    >
      <RulesSettings
        value={{
          penaltyRate,
          approvalThreshold,
          allMembersAreCommittee,
          committeeSize,
        }}
        onChange={updateSettings}
      />
    </WizardLayout>
  );
}
