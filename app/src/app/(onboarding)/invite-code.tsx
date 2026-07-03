import type { JSX } from "react";
import { useState } from "react";
import { FieldError, InputGroup, Label, TextField, useToast } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { withUniwind } from "uniwind";
import { dataClient } from "@/api";
import { nav } from "../../lib/routes";
import { OnboardingLayout } from "../../components/ui/onboarding-layout";

const StyledIonicons = withUniwind(Ionicons);

export default function InviteCodeScreen(): JSX.Element {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  async function handleSubmit() {
    if (!code.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const request = await dataClient.groups.joinByInviteCode("user-new", code.trim());
      nav.onboarding.toPending({
        requestId: request.id,
        groupName: request.groupName,
        requestedAt: request.requestedAt,
      });
    } catch (error) {
      console.error(error);
      setError("Invalid invite code. Check with your group admin.");
      toast.show({
        variant: "danger",
        label: "Could not join group",
        description: "Invalid invite code. Check with your group admin.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <OnboardingLayout
      title="Enter invite code"
      description="Ask your group admin for the invite code or link"
      buttonLabel="Join group"
      isLoading={isLoading}
      isDisabled={!code.trim()}
      onButtonPress={handleSubmit}
    >
      <TextField isInvalid={!!error}>
        <Label>Invite code</Label>
        <InputGroup>
          <InputGroup.Prefix isDecorative>
            <StyledIonicons name="key-outline" size={16} className="text-muted" />
          </InputGroup.Prefix>
          <InputGroup.Input
            autoFocus
            placeholder="e.g. KICUKIRO2025"
            value={code}
            onChangeText={(t) => {
              setCode(t);
              setError(null);
            }}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </InputGroup>
        {error && <FieldError>{error}</FieldError>}
      </TextField>
    </OnboardingLayout>
  );
}
