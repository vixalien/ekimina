import type { JSX } from "react";
import React, { useState } from "react";
import { View } from "react-native";
import { Description, Label, Radio, RadioGroup, Separator, Surface } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { withUniwind } from "uniwind";
import { nav } from "../../lib/nav";
import { OnboardingLayout } from "../../components/ui/onboarding-layout";

const StyledIonicons = withUniwind(Ionicons);

const OPTIONS = [
  {
    value: "invite-code",
    icon: "key-outline" as const,
    title: "Enter an invite code",
    subtitle: "Someone gave you a code or a link",
    route: "/(onboarding)/invite-code" as const,
  },
  {
    value: "search-groups",
    icon: "search-outline" as const,
    title: "Search public groups",
    subtitle: "Browse groups open to anyone",
    route: "/(onboarding)/search-groups" as const,
  },
  {
    value: "create-group",
    icon: "add-circle-outline" as const,
    title: "Create a new group",
    subtitle: "Set it up and invite your members",
    route: null, // TODO: navigate to group creation wizard
  },
];

export default function JoinOrCreateScreen(): JSX.Element {
  const [selected, setSelected] = useState(OPTIONS[0]!.value);

  const selectedOption = OPTIONS.find((o) => o.value === selected);

  function handleContinue() {
    if (selectedOption?.route) {
      nav.push(selectedOption.route);
    }
  }

  return (
    <OnboardingLayout
      title="Join or create a group"
      description="Join an existing ikimina or start your own"
      buttonLabel="Continue"
      onButtonPress={handleContinue}
      isDisabled={!selectedOption?.route}
    >
      <Surface>
        <RadioGroup value={selected} onValueChange={setSelected}>
          {OPTIONS.map((option, index) => (
            <React.Fragment key={option.value}>
              {index > 0 && <Separator className="my-1" />}
              <RadioGroup.Item value={option.value}>
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="size-10 rounded-full bg-accent/10 items-center justify-center">
                    <StyledIonicons
                      name={option.icon}
                      size={20}
                      className="text-foreground"
                    />
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
