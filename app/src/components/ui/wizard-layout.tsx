import type { JSX, ReactNode } from "react";
import { OnboardingLayout } from "./onboarding-layout";

interface WizardLayoutProps {
  step: number;
  totalSteps: number;
  title: string;
  description?: string;
  children: ReactNode;
  buttonLabel: string;
  onButtonPress: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  showBack?: boolean;
}

export function WizardLayout({
  step,
  totalSteps,
  title,
  description,
  children,
  buttonLabel,
  onButtonPress,
  isLoading,
  isDisabled,
  showBack = true,
}: WizardLayoutProps): JSX.Element {
  return (
    <OnboardingLayout
      step={step}
      totalSteps={totalSteps}
      title={title}
      description={description}
      buttonLabel={buttonLabel}
      onButtonPress={onButtonPress}
      isLoading={isLoading}
      isDisabled={isDisabled}
      showBack={showBack}
    >
      {children}
    </OnboardingLayout>
  );
}
