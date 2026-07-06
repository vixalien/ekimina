import type { JSX } from "react";

import { Ionicons } from "@expo/vector-icons";
import { useStore } from "@nanostores/react";
import * as Clipboard from "expo-clipboard";
import { Button, Surface, useToast } from "heroui-native";
import { Share, View } from "react-native";
import { withUniwind } from "uniwind";

import { AppText } from "@/components/ui/app-text";
import { OnboardingLayout } from "@/components/ui/onboarding-layout";
import { nav } from "@/lib/routes";
import { $createdGroup, resetWizard } from "@/stores/create-group";
import { resetGroup } from "@/stores/group";

const StyledIonicons = withUniwind(Ionicons);

function handleGoToGroup() {
  resetWizard();
  resetGroup();
  nav.toTabs();
}

export default function CreateGroupSuccess(): JSX.Element {
  const created = useStore($createdGroup);
  const { toast } = useToast();

  const groupName = created?.name ?? "Your group";
  const inviteCode = created?.inviteCode ?? "--------";

  function handleCopy() {
    void Clipboard.setStringAsync(inviteCode);
    toast.show({
      variant: "success",
      label: "Copied",
      description: "Invite code copied to clipboard",
    });
  }

  function handleShare() {
    void Share.share({
      message: `Join my group "${groupName}" on e-Kimina with code: ${inviteCode}`,
    });
  }

  return (
    <OnboardingLayout
      title=""
      description=""
      buttonLabel="Go to my group"
      onButtonPress={handleGoToGroup}
      showBack={false}
    >
      <View className="items-center gap-3 mb-4">
        <View className="size-16 items-center justify-center rounded-full bg-success/10">
          <StyledIonicons name="checkmark-circle" size={36} className="text-success" />
        </View>
        <View className="items-center gap-1">
          <AppText className="text-2xl font-semibold text-foreground">Group created</AppText>
          <AppText className="text-base text-muted">{groupName}</AppText>
        </View>
      </View>

      <AppText className="text-sm text-muted mb-2">Invite code</AppText>

      <Surface className="flex-row items-center px-4 py-3">
        <Button variant="ghost" isIconOnly size="sm" onPress={handleCopy}>
          <StyledIonicons name="copy-outline" size={18} className="text-foreground" />
        </Button>
        <AppText className="flex-1 text-center text-2xl font-mono text-foreground tracking-widest">
          {inviteCode}
        </AppText>
        <Button variant="ghost" isIconOnly size="sm" onPress={handleShare}>
          <StyledIonicons name="share-outline" size={18} className="text-foreground" />
        </Button>
      </Surface>

      <AppText className="text-sm text-muted mt-4">
        Share this code with people you want to invite. They will need committee approval to join.
      </AppText>
    </OnboardingLayout>
  );
}
