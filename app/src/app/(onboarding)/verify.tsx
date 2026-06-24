import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { View, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  Button,
  InputOTP,
  REGEXP_ONLY_DIGITS,
} from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { withUniwind } from "uniwind";
import { api } from "../../api";
import type { OtpVerificationResult } from "../../api";
import { nav } from "../../lib/nav";
import { AppText } from "../../components/ui/app-text";
import { ScreenContainer } from "../../components/ui/screen-container";

const StyledIonicons = withUniwind(Ionicons);

const RESEND_COOLDOWN = 30;

export default function VerifyScreen(): JSX.Element {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const canResend = resendTimer <= 0;

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleResult = useCallback((result: OtpVerificationResult) => {
    switch (result.status) {
      case "no_groups":
        nav.replace("/(onboarding)/join-or-create");
        break;
      case "one_group":
        nav.replace("/(tabs)");
        break;
      case "multiple_groups":
        // TODO: show group switcher sheet, then navigate to (tabs)
        nav.replace("/(tabs)");
        break;
    }
  }, []);

  async function handleVerify(code: string) {
    if (!phone || isVerifying) return;
    setIsVerifying(true);
    setError(null);
    try {
      const result = await api.auth.verifyOtp(phone, code);
      handleResult(result);
    } catch {
      setError("Invalid code. Please try again.");
      setOtp("");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (!canResend || !phone) return;
    setResendTimer(RESEND_COOLDOWN);
    try {
      await api.auth.resendOtp(phone);
    } catch {
      // silent
    }
  }

  const masked = phone
    ? phone.replace(/(\+\d{3})(\d{3})(\d{3})(\d{3})/, "$1 $2 $3 $4")
    : "";

  return (
    <ScreenContainer extraTop={12}>
      <View className="flex-1 px-6 gap-8 justify-center">
        {/* Back button - absolute positioned */}
        <Pressable
          onPress={() => nav.replace("/(onboarding)/phone")}
          className="absolute top-0 left-0 p-2"
        >
          <StyledIonicons
            name="arrow-back"
            size={22}
            className="text-foreground"
          />
        </Pressable>

        <View className="items-center gap-2">
          <AppText className="text-2xl font-semibold text-foreground">
            Enter the code
          </AppText>
          <AppText className="text-sm text-muted">
            Sent to {masked}
          </AppText>
        </View>

        <View className="items-center gap-3">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            onComplete={handleVerify}
            isInvalid={!!error}
            pattern={REGEXP_ONLY_DIGITS}
          >
            <InputOTP.Group>
              <InputOTP.Slot index={0} />
              <InputOTP.Slot index={1} />
              <InputOTP.Slot index={2} />
            </InputOTP.Group>
            <InputOTP.Separator />
            <InputOTP.Group>
              <InputOTP.Slot index={3} />
              <InputOTP.Slot index={4} />
              <InputOTP.Slot index={5} />
            </InputOTP.Group>
          </InputOTP>

          {error && (
            <AppText className="text-xs text-danger">{error}</AppText>
          )}
        </View>

        <Button
          variant="primary"
          isDisabled={otp.length < 6 || isVerifying}
          onPress={() => handleVerify(otp)}
        >
          <Button.Label>
            {isVerifying ? "Verifying..." : "Verify"}
          </Button.Label>
        </Button>

        <View className="items-center">
          {canResend ? (
            <Button variant="ghost" onPress={handleResend}>
              <Button.Label className="text-accent">
                Resend code
              </Button.Label>
            </Button>
          ) : (
            <AppText className="text-xs text-muted">
              Resend code in {resendTimer}s
            </AppText>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}
