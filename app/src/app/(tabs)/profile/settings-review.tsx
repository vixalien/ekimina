import type { JSX } from "react";

import { useStore } from "@nanostores/react";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { Button, ListGroup, ScrollShadow, useToast } from "heroui-native";
import { useCallback, useState } from "react";
import { View } from "react-native";
import useSWR from "swr";

import { api } from "@/api";
import { LoanSignatureList } from "@/components/loan/loan-signature-row";
import { RejectReasonSheet } from "@/components/loan/reject-reason-sheet";
import { AppText } from "@/components/ui/app-text";
import { Header } from "@/components/ui/header";
import { ScreenContainer } from "@/components/ui/screen-container";
import { nav } from "@/lib/routes";
import { $activeGroup } from "@/stores/active-group";
import { $auth } from "@/stores/auth";

export default function SettingsReviewScreen(): JSX.Element {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { activeGroupId } = useStore($activeGroup);
  const auth = useStore($auth);
  const { toast } = useToast();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const { data: review, isLoading } = useSWR(
    activeGroupId && requestId ? `settings-review:${activeGroupId}:${requestId}` : null,
    () => api.groups.getSettingsChangeReview(activeGroupId!, requestId),
  );

  const handleApprove = useCallback(async () => {
    if (!activeGroupId || !requestId || !auth?.id) return;
    const id = toast.show({
      variant: "default",
      label: "Signing request...",
      duration: "persistent",
    });
    try {
      const result = await api.groups.signSettingsChange(activeGroupId, requestId, auth.id);
      toast.hide(id);
      if (result.thresholdMet) {
        toast.show({
          variant: "success",
          label: "Setting approved",
          description: "All signatures collected. The setting will take effect next cycle.",
        });
      } else {
        toast.show({
          variant: "success",
          label: "Signature recorded",
          description: "Waiting for remaining committee members.",
        });
      }
      nav.back();
    } catch {
      toast.hide(id);
      toast.show({ variant: "danger", label: "Failed to sign" });
    }
  }, [activeGroupId, requestId, auth, toast]);

  const handleReject = useCallback(
    async (_reason: string) => {
      if (!activeGroupId || !requestId || !auth?.id) return;
      setRejecting(true);
      try {
        await api.groups.rejectSettingsChange(activeGroupId, requestId, auth.id);
        toast.show({ variant: "default", label: "Settings change rejected" });
        setRejectOpen(false);
        nav.back();
      } catch {
        toast.show({ variant: "danger", label: "Failed to reject" });
      } finally {
        setRejecting(false);
      }
    },
    [activeGroupId, requestId, auth, toast],
  );

  if (isLoading || !review) {
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
      <Header title="Review Settings Change" canGoBack />
      <ScrollShadow LinearGradientComponent={LinearGradient} className="flex-1">
        <View className="px-6 pt-4 gap-6">
          {/* Current vs proposed */}
          <View className="gap-3">
            <AppText className="text-xs text-muted uppercase tracking-wider ml-2">
              Change details
            </AppText>
            <ListGroup>
              <ListGroup.Item disabled>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{review.fieldLabel}</ListGroup.ItemTitle>
                  <ListGroup.ItemDescription className="text-muted">
                    Requested by {review.requesterName}
                  </ListGroup.ItemDescription>
                </ListGroup.ItemContent>
              </ListGroup.Item>
            </ListGroup>

            <View className="flex-row gap-4">
              <View className="flex-1 bg-surface-secondary rounded-xl p-4 gap-1">
                <AppText className="text-xs text-muted">Current</AppText>
                <AppText className="text-base text-muted line-through">
                  {review.currentValue}
                </AppText>
              </View>
              <View className="flex-1 bg-accent/10 rounded-xl p-4 gap-1">
                <AppText className="text-xs text-muted">Proposed</AppText>
                <AppText className="text-base font-semibold text-foreground">
                  {review.proposedValue}
                </AppText>
              </View>
            </View>
          </View>

          {/* Signatures */}
          <View className="gap-3">
            <AppText className="text-xs text-muted uppercase tracking-wider ml-2">
              Committee signatures, {review.signatureCount} of {review.signatureThreshold}
            </AppText>
            <LoanSignatureList signatures={review.signatures} />
          </View>

          {/* Actions */}
          {review.currentUserAlreadySigned ? (
            <View className="bg-surface-secondary rounded-2xl p-4">
              <AppText className="text-sm text-muted text-center">
                You signed this request on{" "}
                {review.currentUserSignedAt
                  ? new Date(review.currentUserSignedAt).toLocaleDateString("en-RW", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "a previous date"}
              </AppText>
            </View>
          ) : (
            <View className="gap-3">
              <Button variant="primary" onPress={handleApprove}>
                <Button.Label>Approve</Button.Label>
              </Button>
              <Button variant="danger" onPress={() => setRejectOpen(true)}>
                <Button.Label>Reject</Button.Label>
              </Button>
            </View>
          )}
        </View>
      </ScrollShadow>

      <RejectReasonSheet
        isOpen={rejectOpen}
        onOpenChange={setRejectOpen}
        onConfirm={handleReject}
        isLoading={rejecting}
      />
    </ScreenContainer>
  );
}
