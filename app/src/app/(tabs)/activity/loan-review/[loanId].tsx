import type { JSX } from "react";

import type { LoanRequestReview } from "@/api";

import { useStore } from "@nanostores/react";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { Button, ScrollShadow, useToast } from "heroui-native";
import { startTransition, useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";

import { dataClient } from "@/api";
import { BorrowerInfo } from "@/components/loan/borrower-info";
import { LoanSignatureList } from "@/components/loan/loan-signature-row";
import { LoanTermsCard } from "@/components/loan/loan-terms-card";
import { RejectReasonSheet } from "@/components/loan/reject-reason-sheet";
import { AppText } from "@/components/ui/app-text";
import { Header } from "@/components/ui/header";
import { ScreenContainer } from "@/components/ui/screen-container";
import { nav } from "@/lib/routes";
import { $activeGroup } from "@/stores/active-group";
import { $auth } from "@/stores/auth";

export default function LoanReviewScreen(): JSX.Element {
  const { loanId } = useLocalSearchParams<{ loanId: string }>();
  const { activeGroupId } = useStore($activeGroup);
  const auth = useStore($auth);
  const { toast } = useToast();

  const [review, setReview] = useState<LoanRequestReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    if (!activeGroupId || !loanId) return;
    startTransition(() => setLoading(true));
    dataClient.groups
      .getLoanRequestReview(activeGroupId, loanId)
      .then(setReview)
      .catch(() => {})
      .finally(() => startTransition(() => setLoading(false)));
  }, [activeGroupId, loanId]);

  const handleApprove = useCallback(async () => {
    if (!activeGroupId || !loanId || !auth?.id) return;
    const id = toast.show({
      variant: "default",
      label: "Signing request...",
      duration: "persistent",
    });
    try {
      const result = await dataClient.groups.signLoanRequest(activeGroupId, loanId, auth.id);
      toast.hide(id);
      if (result.thresholdMet) {
        toast.show({
          variant: "success",
          label: "Loan approved",
          description: "All signatures collected. Loan is now approved.",
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
  }, [activeGroupId, loanId, auth, toast]);

  const handleReject = useCallback(
    async (_reason: string) => {
      if (!activeGroupId || !loanId || !auth?.id) return;
      setRejecting(true);
      try {
        await dataClient.groups.rejectLoanRequest(activeGroupId, loanId, auth.id);
        toast.show({ variant: "default", label: "Loan request rejected" });
        setRejectOpen(false);
        nav.back();
      } catch {
        toast.show({ variant: "danger", label: "Failed to reject" });
      } finally {
        setRejecting(false);
      }
    },
    [activeGroupId, loanId, auth, toast],
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

  return (
    <ScreenContainer>
      <Header title="Review Loan Request" canGoBack />
      <ScrollShadow LinearGradientComponent={LinearGradient} className="flex-1">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-36"
        >
          <View className="px-6 pt-4 gap-6">
            {/* Borrower info - tappable, navigates to member page */}
            <BorrowerInfo
              borrowerUserId={review.borrowerUserId}
              borrowerName={review.borrowerName}
              borrowerInitials={review.borrowerInitials}
              borrowerRole={review.borrowerRole}
              borrowerJoinedCycle={review.borrowerJoinedCycle}
            />

            {/* Loan terms - reuses same component as detail screen */}
            <View className="gap-3">
              <AppText className="text-xs text-muted uppercase tracking-wider ml-2">
                Loan details
              </AppText>
              <LoanTermsCard
                amount={review.amount}
                interestRate={review.interestRate}
                deadline={review.deadline}
                purpose={review.purpose}
              />
            </View>

            {/* Signatures */}
            <View className="gap-3">
              <AppText className="text-xs text-muted uppercase tracking-wider ml-2">
                Committee signatures, {review.collectedSignatures} of {review.signatureThreshold}
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
