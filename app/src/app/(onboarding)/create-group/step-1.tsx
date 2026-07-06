import type { JSX } from "react";

import type { TemplateId } from "@/stores/group";

import { useStore } from "@nanostores/react";
import { useState } from "react";

import { TemplateSelector } from "@/components/group-settings/template";
import { WizardLayout } from "@/components/ui/wizard-layout";
import { nav } from "@/lib/routes";
import { setStep } from "@/stores/create-group";
import { $group, applyTemplate } from "@/stores/group";

export default function CreateGroupStep1(): JSX.Element {
  const group = useStore($group);
  const [selected, setSelected] = useState<TemplateId | null>(group.templateId);

  function handleNext() {
    if (!selected) return;
    applyTemplate(selected);
    setStep(2);
    nav.onboarding.createGroup.toStep(2);
  }

  return (
    <WizardLayout
      step={1}
      totalSteps={6}
      title="Choose a starting point"
      description="You can change any of these settings later"
      buttonLabel="Next"
      onButtonPress={handleNext}
      isDisabled={!selected}
      showBack={false}
    >
      <TemplateSelector selectedId={selected} onSelect={setSelected} />
    </WizardLayout>
  );
}
