import type { JSX } from "react";
import { useStore } from "@nanostores/react";
import { nav } from "@/lib/routes";
import { WizardLayout } from "@/components/ui/wizard-layout";
import { LoansSettings } from "@/components/group-settings/loans";
import { $group, updateSettings } from "@/stores/group";
import { setStep } from "@/stores/create-group";

export default function CreateGroupStep5(): JSX.Element {
  const group = useStore($group);
  const settings = group.settings;

  const loansEnabled = settings.loansEnabled ?? false;
  const loanInterestRate = settings.loanInterestRate ?? 0;
  const discretionaryFundEnabled = settings.discretionaryFundEnabled ?? false;

  function handleNext() {
    setStep(6);
    nav.onboarding.createGroup.toStep(6);
  }

  return (
    <WizardLayout
      step={5}
      totalSteps={6}
      title="Loans"
      buttonLabel="Review"
      onButtonPress={handleNext}
    >
      <LoansSettings
        value={{ loansEnabled, loanInterestRate, discretionaryFundEnabled }}
        onChange={updateSettings}
      />
    </WizardLayout>
  );
}
