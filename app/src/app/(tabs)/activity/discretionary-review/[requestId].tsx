import type { JSX } from "react";

import { useStore } from "@nanostores/react";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, router } from "expo-router";
import { Button, Chip, ListGroup, PressableFeedback, ScrollShadow, useToast } from "heroui-native";
import { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";
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

export default function DiscretionaryReviewScreen(): JSX.Element {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { activeGroupId } = useStore($activeGroup);
  const auth = useStore($auth);
  const { toast } = useToast();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const { data: review, isLoading } = useSWR(
    activeGroupId && requestId ? `discretionary-review:${activeGroupId}:${requestId}` : null,
    () => api.groups.getDiscretionaryReview(activeGroupId!, requestId),
  );

  const handleApprove = useCallback(async () => {
    if (!activeGroupId || !requestId || !auth?.id) return;
    const id = toast.show({
      variant: "default",
      label: "Signing request...",
      duration: "persistent",
    });
    try {
      const result = await api.groups.signDiscretionaryRequest(activeGroupId, requestId, auth.id);
      toast.hide(id);
      if (result.thresholdMet) {
        toast.show({
          variant: "success",
          label: "Request approved",
          description: "All signatures collected. Transaction will be processed.",
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
        await api.groups.rejectDiscretionaryRequest(activeGroupId, requestId, auth.id);
        toast.show({ variant: "default", label: "Request rejected" });
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

  const directionLabel = review.direction === "deposit" ? "Deposit" : "Withdrawal";

  return (
    <ScreenContainer>
      <Header title="Review Request" canGoBack />
      <ScrollShadow LinearGradientComponent={LinearGradient} className="flex-1">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-36"
        >
          <View className="px-6 pt-4 gap-6">
            {/* Requester info */}
            <ListGroup>
              <PressableFeedback
                animation={false}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/members/[userId]",
                    params: { userId: review.requesterUserId },
                  })
                }
              >
                <PressableFeedback.Scale>
                  <ListGroup.Item>
                    <ListGroup.ItemPrefix>
                      <View className="size-10 rounded-full bg-accent/10 items-center justify-center">
                        <AppText className="text-sm font-semibold text-accent">
                          {review.requesterInitials}
                        </AppText>
                      </View>
                    </ListGroup.ItemPrefix>
                    <ListGroup.ItemContent>
                      <ListGroup.ItemTitle>{review.requesterName}</ListGroup.ItemTitle>
                      <ListGroup.ItemDescription className="text-muted">
                        {directionLabel}
                      </ListGroup.ItemDescription>
                    </ListGroup.ItemContent>
                    <ListGroup.ItemSuffix>
                      <Chip
                        variant="soft"
                        color={review.direction === "deposit" ? "accent" : "default"}
                        size="sm"
                      >
                        <Chip.Label>{directionLabel}</Chip.Label>
                      </Chip>
                    </ListGroup.ItemSuffix>
                  </ListGroup.Item>
                </PressableFeedback.Scale>
                <PressableFeedback.Ripple />
              </PressableFeedback>
            </ListGroup>

            {/* Amount */}
            <AppText className="text-4xl font-hero text-foreground text-center">
              {review.amount.toLocaleString("en-RW")} RWF
            </AppText>

            {/* Request details */}
            <View className="gap-3">
              <AppText className="text-xs text-muted uppercase tracking-wider ml-2">
                Request details
              </AppText>
              <ListGroup>
                <ListGroup.Item disabled>
                  <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>Category</ListGroup.ItemTitle>
                    <ListGroup.ItemDescription className="text-foreground">
                      {review.category}
                    </ListGroup.ItemDescription>
                  </ListGroup.ItemContent>
                </ListGroup.Item>
                <ListGroup.Item disabled>
                  <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>Paid to</ListGroup.ItemTitle>
                    <ListGroup.ItemDescription className="text-foreground">
                      {review.paidTo}
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

            {/* Reason */}
            <View className="gap-2">
              <AppText className="text-xs text-muted uppercase tracking-wider ml-2">Reason</AppText>
              <AppText className="text-sm text-foreground leading-5">{review.reason}</AppText>
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
