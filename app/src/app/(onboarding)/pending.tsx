import type { JSX } from "react";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Button, useToast } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { withUniwind } from "uniwind";
import { api } from "../../api";
import { nav } from "../../lib/routes";
import { AppText } from "../../components/ui/app-text";
import { ScreenContainer } from "../../components/ui/screen-container";

const StyledIonicons = withUniwind(Ionicons);

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default function PendingScreen(): JSX.Element {
  const { requestId, groupName, requestedAt } = useLocalSearchParams<{
    requestId: string;
    groupName: string;
    requestedAt: string;
  }>();
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();
  const [elapsed, setElapsed] = useState(requestedAt ? timeAgo(requestedAt) : "");

  useEffect(() => {
    const interval = setInterval(() => {
      if (requestedAt) {
        setElapsed(timeAgo(requestedAt));
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [requestedAt]);

  async function handleCancel() {
    if (!requestId || isCancelling) return;
    setIsCancelling(true);
    try {
      await api.groups.cancelJoinRequest(requestId);
      nav.onboarding.toJoinOrCreate();
    } catch (error) {
      console.error(error);
      toast.show({
        variant: "danger",
        label: "Could not cancel request",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <ScreenContainer extraTop={12}>
      <View className="flex-1 px-6">
        <View className="gap-2">
          <AppText className="text-2xl font-bold text-foreground">Request sent</AppText>
          <AppText className="text-sm text-muted">
            Your request to join{" "}
            <AppText className="text-sm font-semibold text-foreground">
              {groupName ?? "the group"}
            </AppText>{" "}
            is waiting on committee approval
          </AppText>
        </View>

        <View className="flex-1 pt-6 items-center justify-center gap-4">
          <View className="size-20 rounded-full bg-accent/10 items-center justify-center">
            <StyledIonicons name="time-outline" size={40} className="text-accent-foreground" />
          </View>
          {elapsed ? <AppText className="text-xs text-muted">Sent {elapsed}</AppText> : null}
        </View>

        <View className="pb-4">
          <Button variant="danger-soft" isDisabled={isCancelling} onPress={handleCancel}>
            <Button.Label>{isCancelling ? "Cancelling..." : "Cancel request"}</Button.Label>
          </Button>
        </View>
      </View>
    </ScreenContainer>
  );
}
