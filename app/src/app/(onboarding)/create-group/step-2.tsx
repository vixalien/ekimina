import type { JSX } from "react";

import { useStore } from "@nanostores/react";

import { BasicsSettings } from "@/components/group-settings/basics";
import { WizardLayout } from "@/components/ui/wizard-layout";
import { nav } from "@/lib/routes";
import { setStep } from "@/stores/create-group";
import { $group, updateSettings } from "@/stores/group";

function handleNext() {
  setStep(3);
  nav.onboarding.createGroup.toStep(3);
}

export default function CreateGroupStep2(): JSX.Element {
  const group = useStore($group);
  const settings = group.settings;

  const name = settings.name ?? "";
  const isPublic = settings.isPublic ?? false;

  return (
    <WizardLayout
      step={2}
      totalSteps={6}
      title="Basics"
      buttonLabel="Next"
      onButtonPress={handleNext}
      isDisabled={!name.trim()}
    >
      <BasicsSettings value={{ name, isPublic }} onChange={updateSettings} />
    </WizardLayout>
  );
}
