import { Button, ListGroup, ScrollShadow, useToast } from "heroui-native";
import { useStore } from "@nanostores/react";
import { useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import type { JSX } from "react";
import { startTransition, useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";

import { dataClient } from "@/api";
import type { JoinRequestReview } from "@/api";
import { AppText } from "@/components/ui/app-text";
import { Header } from "@/components/ui/header";
import { ScreenContainer } from "@/components/ui/screen-container";
import { LoanSignatureList } from "@/components/loan/loan-signature-row";
import { RejectReasonSheet } from "@/components/loan/reject-reason-sheet";
import { nav } from "@/lib/routes";
import { $activeGroup } from "@/stores/active-group";
import { $auth } from "@/stores/auth";

export default function JoinReviewScreen(): JSX.Element {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { activeGroupId } = useStore($activeGroup);
  const auth = useStore($auth);
  const { toast } = useToast();

  const [review, setReview] = useState<JoinRequestReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    if (!activeGroupId || !requestId) return;
    startTransition(() => setLoading(true));
    dataClient.groups
      .getJoinRequestReview(activeGroupId, requestId)
      .then(setReview)
      .catch(() => {})
      .finally(() => startTransition(() => setLoading(false)));
  }, [activeGroupId, requestId]);

  const handleApprove = useCallback(async () => {
    if (!activeGroupId || !requestId || !auth?.id) return;
    const id = toast.show({
      variant: "default",
      label: "Signing request...",
      duration: "persistent",
    });
    try {
      const result = await dataClient.groups.signJoinRequest(activeGroupId, requestId, auth.id);
      toast.hide(id);
      if (result.thresholdMet) {
        toast.show({
          variant: "success",
          label: "Applicant approved",
          description: "All signatures collected. They can now access the group.",
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
        await dataClient.groups.rejectJoinRequest(activeGroupId, requestId, auth.id);
        toast.show({ variant: "default", label: "Join request rejected" });
        setRejectOpen(false);
        nav.back();
      } catch {
        toast.show({ variant: "danger", label: "Failed to reject" });
      } finally {
        setRejecting(false);
      }
    },
    [activeGroupId, requestId, auth, toast]
  );

  if (loading || !review) {
    return (
      <ScreenContainer>
        <Header canGoBack />
        <View className="flex-1 items-center justify-center">
          <AppText className="text-muted text-base">Loading...</AppText>
        </View>
      </ScreenContainer>
    );
  }

  const joinMethodLabel =
    review.joinMethod === "invite_code"
      ? `Invite code ${review.inviteCode ?? ""}`
      : "Direct invite";

  return (
    <ScreenContainer>
      <Header title="Review Join Request" canGoBack />
      <ScrollShadow LinearGradientComponent={LinearGradient} className="flex-1">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-36"
        >
          <View className="px-6 pt-4 gap-6">
            {/* Applicant info */}
            <ListGroup>
              <ListGroup.Item disabled>
                <ListGroup.ItemPrefix>
                  <View className="size-10 rounded-full bg-accent/10 items-center justify-center">
                    <AppText className="text-sm font-semibold text-accent">
                      {review.applicantInitials}
                    </AppText>
                  </View>
                </ListGroup.ItemPrefix>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{review.applicantName}</ListGroup.ItemTitle>
                  <ListGroup.ItemDescription className="text-muted">
                    {review.applicantPhone}
                  </ListGroup.ItemDescription>
                </ListGroup.ItemContent>
              </ListGroup.Item>
            </ListGroup>

            {/* Request details */}
            <View className="gap-3">
              <AppText className="text-xs text-muted uppercase tracking-wider ml-2">
                Request details
              </AppText>
              <ListGroup>
                <ListGroup.Item disabled>
                  <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>How they joined</ListGroup.ItemTitle>
                    <ListGroup.ItemDescription className="text-foreground">
                      {joinMethodLabel}
                    </ListGroup.ItemDescription>
                  </ListGroup.ItemContent>
                </ListGroup.Item>
                <ListGroup.Item disabled>
                  <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>Requested on</ListGroup.ItemTitle>
                    <ListGroup.ItemDescription className="text-foreground">
                      {new Date(review.requestedAt).toLocaleDateString("en-RW", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </ListGroup.ItemDescription>
                  </ListGroup.ItemContent>
                </ListGroup.Item>
              </ListGroup>
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
        </ScrollView>
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
