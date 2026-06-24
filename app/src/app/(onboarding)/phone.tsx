import type { JSX } from "react";
import React, { useState } from "react";
import { View } from "react-native";
import {
  Button,
  Description,
  InputGroup,
  Label,
  Select,
  Separator,
  TextField,
} from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { withUniwind } from "uniwind";
import { api } from "../../api";
import { nav } from "../../lib/nav";
import { AppText } from "../../components/ui/app-text";
import { ScreenContainer } from "../../components/ui/screen-container";

const StyledIonicons = withUniwind(Ionicons);

const COUNTRY_CODES = [
  { value: "RW", label: "Rwanda", flag: "\u{1F1F7}\u{1F1FC}", code: "+250" },
  { value: "KE", label: "Kenya", flag: "\u{1F1F0}\u{1F1EA}", code: "+254" },
  { value: "UG", label: "Uganda", flag: "\u{1F1FA}\u{1F1EC}", code: "+256" },
  { value: "TZ", label: "Tanzania", flag: "\u{1F1F9}\u{1F1FF}", code: "+255" },
  { value: "BI", label: "Burundi", flag: "\u{1F1E7}\u{1F1EE}", code: "+257" },
  { value: "CD", label: "DR Congo", flag: "\u{1F1E8}\u{1F1E9}", code: "+243" },
];

type CountryCode = (typeof COUNTRY_CODES)[number];

export default function PhoneScreen(): JSX.Element {
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState<CountryCode>(
    COUNTRY_CODES[0]!,
  );
  const [isLoading, setIsLoading] = useState(false);

  const isValid = phone.replace(/\s/g, "").length >= 9;

  async function handleContinue() {
    if (!isValid) return;
    setIsLoading(true);
    try {
      const fullPhone = `${countryCode.code}${phone.replace(/\s/g, "")}`;
      await api.auth.sendOtp(fullPhone);
      nav.push("/(onboarding)/verify", { phone: fullPhone });
    } catch {
      // error handling
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <View className="flex-1 px-6 gap-8">
        {/* Header at top */}
        <View className="gap-3">
          <AppText className="text-3xl font-semibold text-foreground">
            e-Kimina
          </AppText>
          <AppText className="text-base text-muted">
            Cooperative savings, made transparent
          </AppText>
        </View>

        {/* Spacer pushes bottom content down */}
        <View className="flex-1" />

        {/* Inputs + button at bottom for reachability */}
        <View className="gap-4">
          <TextField isRequired>
            <Label>Phone number</Label>
            <InputGroup>
              <InputGroup.Prefix className="flex-row">
                <Select
                  presentation="bottom-sheet"
                  value={countryCode}
                  onValueChange={(value) => {
                    const found = COUNTRY_CODES.find(
                      (c) => c.value === value?.value,
                    );
                    if (found) setCountryCode(found);
                  }}
                >
                  <Select.Trigger
                    variant="unstyled"
                    className="flex-row items-center gap-1"
                  >
                    <AppText className="text-base">{countryCode.flag}</AppText>
                    <AppText className="text-sm font-medium text-foreground">
                      {countryCode.code}
                    </AppText>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Overlay />
                    <Select.Content presentation="bottom-sheet">
                      <Select.ListLabel>Select country</Select.ListLabel>
                      {COUNTRY_CODES.map((option, index) => (
                        <React.Fragment key={option.value}>
                          <Select.Item value={option.value} label={option.label}>
                            <AppText className="text-xl">{option.flag}</AppText>
                            <AppText className="text-sm text-muted w-10">
                              {option.code}
                            </AppText>
                            <AppText className="flex-1 text-base text-foreground">
                              {option.label}
                            </AppText>
                            <Select.ItemIndicator />
                          </Select.Item>
                          {index < COUNTRY_CODES.length - 1 && <Separator />}
                        </React.Fragment>
                      ))}
                    </Select.Content>
                  </Select.Portal>
                </Select>
                <Separator orientation="vertical" className="h-5" />
              </InputGroup.Prefix>
              <InputGroup.Input
                value={phone}
                onChangeText={setPhone}
                placeholder="7XX XXX XXX"
                keyboardType="phone-pad"
                maxLength={11}
              />
            </InputGroup>
            <Description>
              We&apos;ll send you a verification code via SMS
            </Description>
          </TextField>

          <Button
            variant="primary"
            isDisabled={!isValid || isLoading}
            onPress={handleContinue}
          >
            <Button.Label>
              {isLoading ? "Sending..." : "Continue"}
            </Button.Label>
            {!isLoading && (
              <StyledIonicons
                name="arrow-forward"
                size={18}
                className="text-accent-foreground"
              />
            )}
          </Button>
        </View>
      </View>
    </ScreenContainer>
  );
}
