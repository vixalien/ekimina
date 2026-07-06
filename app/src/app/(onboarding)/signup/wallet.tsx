import type { JSX } from "react";

import { Ionicons } from "@expo/vector-icons";
import { Description, Label, Radio, RadioGroup, Separator, Surface } from "heroui-native";
import React, { useState } from "react";
import { View } from "react-native";
import { withUniwind } from "uniwind";

import { OnboardingLayout } from "../../../components/ui/onboarding-layout";
import { nav } from "../../../lib/routes";

const StyledIonicons = withUniwind(Ionicons);

const WALLET_OPTIONS = [
  {
    value: "metamask",
    icon: "wallet-outline" as const,
    title: "MetaMask",
    subtitle: "Connect your MetaMask wallet",
  },
  {
    value: "walletconnect",
    icon: "qr-code-outline" as const,
    title: "WalletConnect",
    subtitle: "Scan a QR code to connect",
  },
  {
    value: "mobile-money",
    icon: "phone-portrait-outline" as const,
    title: "Link Mobile Money",
    subtitle: "Connect via MTN or Airtel Money",
  },
] as const;

export default function SignupWalletScreen(): JSX.Element {
  const [selected, setSelected] = useState<string>(WALLET_OPTIONS[0].value);
  const [isLoading, setIsLoading] = useState(false);

  async function handleConnect() {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // mock
      nav.onboarding.toJoinOrCreate();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <OnboardingLayout
      title="Connect your wallet"
      description="Choose how you'd like to connect"
      buttonLabel="Connect"
      isLoading={isLoading}
      onButtonPress={handleConnect}
      step={2}
      totalSteps={2}
    >
      <Surface>
        <RadioGroup value={selected} onValueChange={setSelected}>
          {WALLET_OPTIONS.map((option, index) => (
            <React.Fragment key={option.value}>
              {index > 0 && <Separator className="my-1" />}
              <RadioGroup.Item value={option.value}>
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="size-10 rounded-full bg-accent/10 items-center justify-center">
                    <StyledIonicons name={option.icon} size={20} className="text-foreground" />
                  </View>
                  <View className="flex-1">
                    <Label>{option.title}</Label>
                    <Description>{option.subtitle}</Description>
                  </View>
                </View>
                <Radio />
              </RadioGroup.Item>
            </React.Fragment>
          ))}
        </RadioGroup>
      </Surface>
    </OnboardingLayout>
  );
}
