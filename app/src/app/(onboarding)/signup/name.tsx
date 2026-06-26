import type { JSX } from "react";
import { useState } from "react";
import { useStore } from "@nanostores/react";
import { InputGroup, Label, TextField, useToast } from "heroui-native";
import { api } from "../../../api";
import { nav } from "../../../lib/routes";
import { $auth, setAuth } from "../../../stores/auth";
import { saveAuth } from "../../../lib/auth-storage";
import { OnboardingLayout } from "../../../components/ui/onboarding-layout";

export default function SignupNameScreen(): JSX.Element {
  const auth = useStore($auth);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  async function handleContinue() {
    if (name.trim().length < 2 || !auth?.token) return;
    setIsLoading(true);
    try {
      console.log("here");
      await api.auth.updateProfile(auth.token, name.trim());
      const updated = { ...auth, name: name.trim() };
      setAuth(updated);
      await saveAuth(updated);
      nav.onboarding.signup.toWallet();
    } catch (error) {
      console.error(error);
      toast.show({
        variant: "danger",
        label: "Could not save your name",
        description: String(error) || "An unexpected error happened",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <OnboardingLayout
      title="What's your name?"
      description="This is how you'll appear to your group members"
      buttonLabel="Continue"
      isLoading={isLoading}
      isDisabled={name.trim().length < 2}
      onButtonPress={handleContinue}
      step={1}
      totalSteps={2}
    >
      <TextField isRequired>
        <Label>Full name</Label>
        <InputGroup>
          <InputGroup.Input
            autoFocus
            value={name}
            onChangeText={setName}
            placeholder="e.g. Jean Mugabo"
            autoCapitalize="words"
            autoCorrect={false}
          />
        </InputGroup>
      </TextField>
    </OnboardingLayout>
  );
}
