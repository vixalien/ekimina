import type { JSX } from "react";

import type { GroupInviteData } from "@/api";

import { Ionicons } from "@expo/vector-icons";
import { useStore } from "@nanostores/react";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import {
  Button,
  InputGroup,
  ListGroup,
  ScrollShadow,
  Separator,
  Surface,
  TextField,
  useToast,
} from "heroui-native";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Share, View } from "react-native";
import { withUniwind } from "uniwind";

import { dataClient } from "@/api";
import { AppText } from "@/components/ui/app-text";
import { Header } from "@/components/ui/header";
import { ScreenContainer } from "@/components/ui/screen-container";
import { $activeGroup } from "@/stores/active-group";

const StyledIonicons = withUniwind(Ionicons);

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "sent today";
  if (diffDays === 1) return "sent yesterday";
  if (diffDays < 7) return `sent ${diffDays} days ago`;
  return `sent ${Math.floor(diffDays / 7)} weeks ago`;
}

export default function InviteScreen(): JSX.Element {
  const { activeGroupId } = useStore($activeGroup);
  const { toast } = useToast();

  const [data, setData] = useState<GroupInviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!activeGroupId) return;
    dataClient.groups
      .getGroupInviteData(activeGroupId)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeGroupId]);

  const handleCopy = useCallback(() => {
    if (!data) return;
    void Clipboard.setStringAsync(data.inviteCode);
    toast.show({
      variant: "success",
      label: "Copied",
      description: "Invite code copied to clipboard",
    });
  }, [data, toast]);

  const handleShare = useCallback(() => {
    if (!data) return;
    Share.share({
      message: `Join my group on e-Kimina with code: ${data.inviteCode}\n\n${data.shareLink}`,
    }).catch(() => {});
  }, [data]);

  const handleSend = useCallback(async () => {
    if (!activeGroupId || !phone.trim() || sending) return;
    setSending(true);
    try {
      await dataClient.groups.sendPhoneInvite(activeGroupId, phone.trim());
      toast.show({
        variant: "success",
        label: "Invite sent",
        description: `Invitation sent to ${phone}`,
      });
      setPhone("");
    } catch {
      toast.show({ variant: "danger", label: "Failed to send invite" });
    } finally {
      setSending(false);
    }
  }, [activeGroupId, phone, sending, toast]);

  if (loading || !data) {
    return (
      <ScreenContainer>
        <Header canGoBack />
        <View className="flex-1 items-center justify-center">
          <AppText className="text-muted text-base">Loading...</AppText>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Header title="Invite members" canGoBack />
      <ScrollShadow LinearGradientComponent={LinearGradient} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-36">
          <View className="px-6 pt-4 gap-6">
            {/* Invite code card */}
            <Surface variant="secondary" className="py-6 px-4 items-center gap-4 rounded-2xl">
              <AppText className="text-xs text-muted uppercase tracking-wider">Invite code</AppText>
              <AppText className="text-3xl font-mono tracking-[0.25em] text-foreground">
                {data.inviteCode}
              </AppText>
              <View className="flex-row gap-3">
                <Button variant="secondary" onPress={handleCopy}>
                  <StyledIonicons name="copy-outline" size={16} className="text-foreground" />
                  <Button.Label>Copy code</Button.Label>
                </Button>
                <Button variant="secondary" onPress={handleShare}>
                  <StyledIonicons name="share-outline" size={16} className="text-foreground" />
                  <Button.Label>Share link</Button.Label>
                </Button>
              </View>
            </Surface>

            {/* Divider */}
            <View className="flex-row items-center gap-3">
              <Separator className="flex-1" />
              <AppText className="text-xs text-muted">Or invite by phone number</AppText>
              <Separator className="flex-1" />
            </View>

            {/* Phone input */}
            <View className="flex-row gap-2 items-end">
              <View className="flex-1">
                <TextField isRequired>
                  <InputGroup>
                    <InputGroup.Prefix isDecorative>
                      <AppText className="text-sm text-foreground font-medium">+250</AppText>
                    </InputGroup.Prefix>
                    <InputGroup.Input
                      placeholder="7XX XXX XXX"
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                    />
                  </InputGroup>
                </TextField>
              </View>
              <Button variant="primary" onPress={handleSend} isDisabled={!phone.trim() || sending}>
                <Button.Label>{sending ? "Sending..." : "Send"}</Button.Label>
              </Button>
            </View>

            {/* Helper note */}
            <AppText className="text-xs text-muted text-center leading-4">
              Sharing the code or sending it is not an approval step. The committee reviews it once
              someone tries to join.
            </AppText>

            {/* Sent invites */}
            {data.sentInvites.length > 0 && (
              <View className="gap-3">
                <AppText className="text-xs text-muted uppercase tracking-wider">
                  Sent invites
                </AppText>
                <ListGroup>
                  {data.sentInvites.map((invite: any, index: number) => (
                    <View key={invite.phone}>
                      {index > 0 && <Separator className="mx-4" />}
                      <ListGroup.Item disabled>
                        <ListGroup.ItemPrefix>
                          <StyledIonicons
                            name="phone-portrait-outline"
                            size={18}
                            className="text-muted"
                          />
                        </ListGroup.ItemPrefix>
                        <ListGroup.ItemContent>
                          <ListGroup.ItemTitle>{invite.phone}</ListGroup.ItemTitle>
                          <ListGroup.ItemDescription className="text-muted">
                            <AppText className="text-xs text-muted">
                              {relativeTime(invite.sentAt)}
                            </AppText>
                          </ListGroup.ItemDescription>
                        </ListGroup.ItemContent>
                      </ListGroup.Item>
                    </View>
                  ))}
                </ListGroup>
              </View>
            )}
          </View>
        </ScrollView>
      </ScrollShadow>
    </ScreenContainer>
  );
}
