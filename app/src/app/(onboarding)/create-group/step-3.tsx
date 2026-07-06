import type { JSX } from "react";

import { useStore } from "@nanostores/react";

import { MoneySettings } from "@/components/group-settings/money";
import { WizardLayout } from "@/components/ui/wizard-layout";
import { nav } from "@/lib/routes";
import { setStep } from "@/stores/create-group";
import { $group, updateSettings } from "@/stores/group";

function handleNext() {
  setStep(4);
  nav.onboarding.createGroup.toStep(4);
}

export default function CreateGroupStep3(): JSX.Element {
  const group = useStore($group);
  const settings = group.settings;

  const contributionAmount = settings.contributionAmount ?? 0;
  const cycleLength = settings.cycleLength ?? 0;
  const payoutAmount = settings.payoutAmount ?? 0;

  const isValid = contributionAmount > 0 && cycleLength > 0 && payoutAmount > 0;

  return (
    <WizardLayout
      step={3}
      totalSteps={6}
      title="Money"
      buttonLabel="Next"
      onButtonPress={handleNext}
      isDisabled={!isValid}
    >
      <MoneySettings
        value={{ contributionAmount, cycleLength, payoutAmount }}
        onChange={updateSettings}
      />
    </WizardLayout>
  );
}
