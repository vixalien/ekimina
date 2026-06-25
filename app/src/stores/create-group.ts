import { atom } from "nanostores";

export const $currentStep = atom(1);
export const $isSubmitting = atom(false);
export const $submitError = atom<string | null>(null);
export const $createdGroup = atom<{
  id: string;
  name: string;
  inviteCode: string;
} | null>(null);

export function setStep(step: number): void {
  $currentStep.set(step);
}

export function resetWizard(): void {
  $currentStep.set(1);
  $isSubmitting.set(false);
  $submitError.set(null);
  $createdGroup.set(null);
}
