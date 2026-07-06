import type { JSX } from "react";

import type { Address } from "@/api";

import { useLocalSearchParams } from "expo-router";
import { Button, InputOTP, REGEXP_ONLY_DIGITS, type InputOTPRef, useToast } from "heroui-native";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";

import { api } from "@/api";

import { AppText } from "../../components/ui/app-text";
import { OnboardingLayout } from "../../components/ui/onboarding-layout";
import { saveAuth } from "../../lib/auth-storage";
import { nav } from "../../lib/routes";
import { loginWithOtp } from "../../stores/auth";

const RESEND_COOLDOWN = 30;

async function navigateAfterAuth(result: { status: string; user: { address: string } }) {
  if (result.status === "created") {
    nav.onboarding.signup.toName();
    return;
  }

  const address = result.user.address as Address;
  const memberships = await api.groups.myGroups(address);

  if (memberships.length === 0) {
    nav.onboarding.toJoinOrCreate();
  } else if (memberships.length === 1) {
    nav.toTabs();
  } else {
    nav.onboarding.toJoinOrCreate();
  }
}

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
    if (resendTimer <= 0) {
      return () => {};
    }
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  async function handleVerify(code: string) {
    if (!phone || isVerifying) return;
    setIsVerifying(true);
    setError(null);
    try {
      const result = await api.auth.verifyOtp(phone, code);
      const authUser = await loginWithOtp(phone, result);
      await saveAuth(authUser);
      await navigateAfterAuth(result);
    } catch (e) {
      console.error(e);
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
      await api.auth.sendOtp(phone);
    } catch (e) {
      console.error(e);
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
