import type { JSX } from "react";

import { useStore } from "@nanostores/react";

import { RulesSettings } from "@/components/group-settings/rules";
import { WizardLayout } from "@/components/ui/wizard-layout";
import { nav } from "@/lib/routes";
import { setStep } from "@/stores/create-group";
import { $group, updateSettings } from "@/stores/group";

function handleNext() {
  setStep(5);
  nav.onboarding.createGroup.toStep(5);
}

export default function CreateGroupStep4(): JSX.Element {
  const group = useStore($group);
  const settings = group.settings;

  const penaltyRate = settings.penaltyRate ?? 0;
  const approvalThreshold = settings.approvalThreshold ?? 0.5;
  const allMembersAreCommittee = settings.allMembersAreCommittee ?? false;
  const committeeSize = settings.committeeSize ?? 0;

  const isValid = allMembersAreCommittee || committeeSize > 0;

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
