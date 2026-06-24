import type { JSX } from "react";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { withUniwind } from "uniwind";
import { nav } from "../../lib/nav";
import { AppText } from "../../components/ui/app-text";
import { ScreenContainer } from "../../components/ui/screen-container";

const StyledIonicons = withUniwind(Ionicons);

interface OptionRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}

function OptionRow({ icon, title, subtitle, onPress }: OptionRowProps) {
  return (
    <Pressable onPress={onPress}>
      <View className="flex-row items-center gap-4 bg-surface-secondary rounded-xl p-4">
        <View className="size-10 rounded-full bg-accent/10 items-center justify-center">
          <StyledIonicons name={icon} size={20} className="text-foreground" />
        </View>
        <View className="flex-1 gap-0.5">
          <AppText className="text-base font-semibold text-foreground">
            {title}
          </AppText>
          <AppText className="text-xs text-muted">{subtitle}</AppText>
        </View>
        <StyledIonicons
          name="chevron-forward"
          size={18}
          className="text-muted"
        />
      </View>
    </Pressable>
  );
}

export default function JoinOrCreateScreen(): JSX.Element {
  return (
    <ScreenContainer className="justify-center px-6 gap-8">
      <View className="items-center gap-2">
        <View className="size-16 rounded-full bg-accent/10 items-center justify-center mb-2">
          <StyledIonicons name="people" size={32} className="text-muted" />
        </View>
        <AppText className="text-2xl font-semibold text-foreground text-center">
          You&apos;re not in a group yet
        </AppText>
        <AppText className="text-sm text-muted text-center">
          Join an existing ikimina or start your own
        </AppText>
      </View>

      <View className="gap-3">
        <OptionRow
          icon="key-outline"
          title="Enter an invite code"
          subtitle="Someone gave you a code or a link"
          onPress={() => nav.push("/(onboarding)/invite-code")}
        />
        <OptionRow
          icon="search-outline"
          title="Search public groups"
          subtitle="Browse groups open to anyone"
          onPress={() => nav.push("/(onboarding)/search-groups")}
        />
        <OptionRow
          icon="add-circle-outline"
          title="Create a new group"
          subtitle="Set it up and invite your members"
          onPress={() => {
            // TODO: navigate to group creation wizard
          }}
        />
      </View>
    </ScreenContainer>
  );
}
