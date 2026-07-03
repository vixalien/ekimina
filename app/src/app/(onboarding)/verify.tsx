import type { JSX } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Button, InputOTP, REGEXP_ONLY_DIGITS, type InputOTPRef, useToast } from "heroui-native";
import { dataClient } from "@/api";
import { nav } from "../../lib/routes";
import { loginWithOtp } from "../../stores/auth";
import { saveAuth } from "../../lib/auth-storage";
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
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => otpRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleResult = useCallback(async (result: any) => {
    const authUser = await loginWithOtp(phone ?? "", otp);
    await saveAuth(authUser);

    if (result.status === "created") {
      nav.onboarding.signup.toName();
    } else {
      nav.onboarding.toJoinOrCreate();
    }
  }, [phone, otp]);

  async function handleVerify(code: string) {
    if (!phone || isVerifying) return;
    setIsVerifying(true);
    setError(null);
    try {
      const result = await dataClient.auth.verifyOtp(phone, code);
      await handleResult(result);
    } catch (error) {
      console.error(error);
      setError("Invalid code. Please try again.");
      setOtp("");
      toast.show({
        variant: "danger",
        label: "Verification failed",
        description: "The code you entered is incorrect. Please try again.",
      });
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (!canResend || !phone) return;
    setResendTimer(RESEND_COOLDOWN);
    try {
      await dataClient.auth.sendOtp(phone);
    } catch (error) {
      console.error(error);
      toast.show({
        variant: "danger",
        label: "Could not resend code",
        description: "Something went wrong. Please try again.",
      });
    }
  }

  const masked = phone ? phone.replace(/(\+\d{3})(\d{3})(\d{3})(\d{3})/, "$1 $2 $3 $4") : "";

  return (
    <OnboardingLayout
      title="Enter the code"
      description={`Sent to ${masked}`}
      buttonLabel="Verify"
      isLoading={isVerifying}
      isDisabled={otp.length < 6}
      onButtonPress={() => handleVerify(otp)}
      step={2}
      totalSteps={2}
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

        {error && <AppText className="text-xs text-danger">{error}</AppText>}

        <View className="flex-row items-center mt-2">
          {canResend ? (
            <Button size="sm" variant="ghost" onPress={handleResend}>
              <Button.Label className="text-accent">Resend code</Button.Label>
            </Button>
          ) : (
            <AppText className="text-xs text-muted">Resend code in {resendTimer}s</AppText>
          )}
        </View>
      </View>
    </OnboardingLayout>
  );
}
