import type { JSX } from "react";
import { Share } from "react-native";
import { Button, Surface, useToast } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { withUniwind } from "uniwind";
import { useStore } from "@nanostores/react";
import * as Clipboard from "expo-clipboard";

import { nav } from "@/lib/nav";
import { AppText } from "@/components/ui/app-text";
import { OnboardingLayout } from "@/components/ui/onboarding-layout";
import { $createdGroup, resetWizard } from "@/stores/create-group";
import { resetGroup } from "@/stores/group";

const StyledIonicons = withUniwind(Ionicons);

export default function CreateGroupSuccess(): JSX.Element {
  const created = useStore($createdGroup);
  const { toast } = useToast();

  const groupName = created?.name ?? "Your group";
  const inviteCode = created?.inviteCode ?? "--------";

  function handleCopy() {
    Clipboard.setStringAsync(inviteCode);
    toast.show({
      variant: "success",
      label: "Copied",
      description: "Invite code copied to clipboard",
    });
  }

  function handleShare() {
    Share.share({
      message: `Join my group "${groupName}" on e-Kimina with code: ${inviteCode}`,
    }).catch(() => {});
  }

  function handleGoToGroup() {
    resetWizard();
    resetGroup();
    nav.replace("/(tabs)");
  }

  return (
    <OnboardingLayout
      title="Group created"
      description={groupName}
      buttonLabel="Go to my group"
      onButtonPress={handleGoToGroup}
      showBack={false}
    >
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
