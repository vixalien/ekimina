import type { JSX } from "react";
import { useState } from "react";
import { View, Pressable } from "react-native";
import {
  Button,
  FieldError,
  InputGroup,
  Label,
  TextField,
} from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { withUniwind } from "uniwind";
import { api } from "../../api";
import { nav } from "../../lib/nav";
import { AppText } from "../../components/ui/app-text";
import { ScreenContainer } from "../../components/ui/screen-container";

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
    <ScreenContainer extraTop={12}>
      <View className="flex-1 px-6 gap-8">
        {/* Back button */}
        <Pressable
          onPress={() => nav.replace("/(onboarding)/join-or-create")}
          className="absolute top-0 left-0 p-2"
        >
          <StyledIonicons
            name="arrow-back"
            size={22}
            className="text-foreground"
          />
        </Pressable>

        {/* Header at top */}
        <View className="gap-2 mt-4">
          <AppText className="text-2xl font-semibold text-foreground">
            Enter invite code
          </AppText>
          <AppText className="text-sm text-muted">
            Ask your group admin for the invite code or link
          </AppText>
        </View>

        {/* Spacer */}
        <View className="flex-1" />

        {/* Input + button at bottom */}
        <View className="gap-4">
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

          <Button
            variant="primary"
            isDisabled={!code.trim() || isLoading}
            onPress={handleSubmit}
          >
            <Button.Label>
              {isLoading ? "Checking..." : "Join group"}
            </Button.Label>
          </Button>
        </View>
      </View>
    </ScreenContainer>
  );
}
