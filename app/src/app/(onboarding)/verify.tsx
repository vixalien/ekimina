import type { JSX } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Button, InputOTP, REGEXP_ONLY_DIGITS, type InputOTPRef } from "heroui-native";
import { api } from "../../api";
import type { OtpVerificationResult } from "../../api";
import { nav } from "../../lib/nav";
import { AppText } from "../../components/ui/app-text";
import { OnboardingLayout } from "../../components/ui/onboarding-layout";

const RESEND_COOLDOWN = 30;

export default function VerifyScreen(): JSX.Element {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const otpRef = useRef<InputOTPRef>(null);
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const canResend = resendTimer <= 0;

  useEffect(() => {
    const timer = setTimeout(() => otpRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

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
    <OnboardingLayout
      title="Enter the code"
      description={`Sent to ${masked}`}
      buttonLabel="Verify"
      isLoading={isVerifying}
      isDisabled={otp.length < 6}
      onButtonPress={() => handleVerify(otp)}
    >
      <View className="gap-3 items-center">
        <InputOTP
          ref={otpRef}
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

        <View className="flex-row items-center mt-2">
          {canResend ? (
            <Button size="sm" variant="ghost" onPress={handleResend}>
              <Button.Label className="text-accent">Resend code</Button.Label>
            </Button>
          ) : (
            <AppText className="text-xs text-muted">
              Resend code in {resendTimer}s
            </AppText>
          )}
        </View>
      </View>
    </OnboardingLayout>
  );
}
