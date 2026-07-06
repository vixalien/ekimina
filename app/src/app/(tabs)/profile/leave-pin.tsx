import type { JSX } from "react";

import { Ionicons } from "@expo/vector-icons";
import { useStore } from "@nanostores/react";
import { FieldError, InputOTP, PressableFeedback } from "heroui-native";
import { useCallback, useState } from "react";
import { View, Keyboard } from "react-native";
import { withUniwind } from "uniwind";

import { api } from "@/api";
import { AppText } from "@/components/ui/app-text";
import { ScreenContainer } from "@/components/ui/screen-container";
import { nav } from "@/lib/routes";
import { $activeGroup } from "@/stores/active-group";
import { $auth } from "@/stores/auth";

const StyledIonicons = withUniwind(Ionicons);

function goBack() {
  nav.back();
}

export default function LeaveGroupPin(): JSX.Element {
  const { activeGroupId } = useStore($activeGroup);
  const auth = useStore($auth);
  const userId = auth?.id;
  const [pin, setPin] = useState("");
  const [showError, setShowError] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = useCallback(async () => {
    if (pin.length < 4 || !userId || verifying) return;
    setVerifying(true);
    setShowError(false);
    try {
      await api.groups.verifyPin(userId, pin);
      if (activeGroupId) {
        api.groups.leaveGroup(activeGroupId, userId).catch(() => {});
      }
      nav.profile.toLeaveGroupSent();
    } catch {
      setShowError(true);
      setPin("");
      Keyboard.dismiss();
    } finally {
      setVerifying(false);
    }
  }, [pin, userId, activeGroupId, verifying]);

  return (
    <ScreenContainer>
      <View className="flex-1 px-4 pt-12">
        {/* Back button */}
        <PressableFeedback animation={false} onPress={goBack}>
          <View className="size-10 items-center justify-center rounded-full bg-surface-secondary">
            <StyledIonicons name="arrow-back" size={22} className="text-foreground" />
          </View>
        </PressableFeedback>

        <View className="flex-1 items-center justify-center gap-6">
          <View className="items-center gap-2">
            <AppText className="text-2xl font-semibold text-foreground">Confirm it is you</AppText>
            <AppText className="text-base text-muted text-center">
              Enter your PIN to confirm you want to leave
            </AppText>
            <AppText className="text-xs text-muted">PIN: 1234</AppText>
          </View>

          <InputOTP
            maxLength={4}
            value={pin}
            onChange={(v) => {
              setPin(v);
              setShowError(false);
            }}
            isInvalid={showError}
            onComplete={handleVerify}
          >
            <InputOTP.Slot index={0} />
            <InputOTP.Slot index={1} />
            <InputOTP.Slot index={2} />
            <InputOTP.Slot index={3} />
          </InputOTP>

          <FieldError isInvalid={showError} className="text-center">
            Incorrect PIN, please try again.
          </FieldError>
        </View>
      </View>
    </ScreenContainer>
  );
}
