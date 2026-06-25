import type { JSX } from "react";
import { useState } from "react";
import {
  FieldError,
  InputGroup,
  Label,
  TextField,
} from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { withUniwind } from "uniwind";
import { api } from "../../api";
import { nav } from "../../lib/nav";
import { OnboardingLayout } from "../../components/ui/onboarding-layout";

const StyledIonicons = withUniwind(Ionicons);

export default function InviteCodeScreen(): JSX.Element {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!code.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const request = await api.groups.joinByInviteCode(
        "user-new",
        code.trim(),
      );
      nav.replace("/(onboarding)/pending", {
        requestId: request.id,
        groupName: request.groupName,
        requestedAt: request.requestedAt,
      });
    } catch {
      setError("Invalid invite code. Check with your group admin.");
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
            <StyledIonicons
              name="key-outline"
              size={16}
              className="text-muted"
            />
          </InputGroup.Prefix>
          <InputGroup.Input
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
