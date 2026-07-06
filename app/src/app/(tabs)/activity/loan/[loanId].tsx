import type { JSX } from "react";

import type {
  ApprovedLoanDetail,
  DefaultedLoanDetail,
  DisbursedLoanDetail,
  LoanDetail,
  RepaidLoanDetail,
  RepayingLoanDetail,
  RequestedLoanDetail,
  SigningLoanDetail,
} from "@/api";

import { Ionicons } from "@expo/vector-icons";
import { useStore } from "@nanostores/react";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import {
  BottomSheet,
  Button,
  Chip,
  ListGroup,
  PressableFeedback,
  ScrollShadow,
  Separator,
} from "heroui-native";
import { startTransition, useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { withUniwind } from "uniwind";

import { api } from "@/api";
import { BorrowerInfo } from "@/components/loan/borrower-info";
import { LoanSignatureList } from "@/components/loan/loan-signature-row";
import { LoanTermsCard } from "@/components/loan/loan-terms-card";
import { RepaymentInfo } from "@/components/loan/repayment-info";
import { AppText } from "@/components/ui/app-text";
import { Header } from "@/components/ui/header";
import { ScreenContainer } from "@/components/ui/screen-container";
import { LOAN_STATE_CHIP_COLOR, LOAN_STATE_LABELS } from "@/lib/activity-constants";
import { nav } from "@/lib/routes";
import { formatRWF } from "@/lib/strings";
import { $activeGroup } from "@/stores/active-group";

const StyledIonicons = withUniwind(Ionicons);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-RW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ── Status states info bottom sheet ────────────────────────────────────

const ALL_STATES: { state: string; description: string }[] = [
  { state: "disbursed", description: "Funds sent to borrower, repayment pending" },
  { state: "repaying", description: "Borrower is repaying the loan" },
  { state: "repaid", description: "Loan fully repaid, interest added to group reserve" },
  { state: "defaulted", description: "Borrower missed repayment, balance absorbed by reserve" },
];

function StatusInfoSheet({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}): JSX.Element {
  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Trigger asChild>{null}</BottomSheet.Trigger>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          <BottomSheet.Title>Loan statuses</BottomSheet.Title>
          <BottomSheet.Description>
            The possible states of a loan in this group.
          </BottomSheet.Description>
          <View className="gap-4 mt-4">
            {ALL_STATES.map((item) => (
              <View key={item.state} className="flex-row items-start gap-3">
                <View className="mt-0.5">
                  <Chip variant="secondary" color={LOAN_STATE_CHIP_COLOR[item.state]} size="sm">
                    <Chip.Label>{LOAN_STATE_LABELS[item.state]}</Chip.Label>
                  </Chip>
                </View>
                <AppText className="flex-1 text-sm text-muted">{item.description}</AppText>
              </View>
            ))}
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

// ── State-specific ListGroup sections ──────────────────────────────────

function RequestedSection({ detail }: { detail: RequestedLoanDetail }): JSX.Element {
  return (
    <ListGroup>
      <ListGroup.Item disabled>
        <ListGroup.ItemContent>
          <ListGroup.ItemTitle className="text-muted font-normal text-sm">
            Submitted
          </ListGroup.ItemTitle>
        </ListGroup.ItemContent>
        <ListGroup.ItemSuffix>
          <AppText className="text-sm font-medium text-foreground">
            {formatDate(detail.submittedAt)}
          </AppText>
        </ListGroup.ItemSuffix>
      </ListGroup.Item>
      <Separator className="mx-4" />
      <ListGroup.Item disabled>
        <ListGroup.ItemContent>
          <ListGroup.ItemTitle className="text-muted font-normal text-sm">
            Signatures
          </ListGroup.ItemTitle>
        </ListGroup.ItemContent>
        <ListGroup.ItemSuffix>
          <AppText className="text-sm font-medium text-foreground">
            {detail.collectedSignatures} of {detail.signatureThreshold}
          </AppText>
        </ListGroup.ItemSuffix>
      </ListGroup.Item>
    </ListGroup>
  );
}

function SigningSection({ detail }: { detail: SigningLoanDetail }): JSX.Element {
  return (
    <View className="gap-4">
      <ListGroup>
        <ListGroup.Item disabled>
          <ListGroup.ItemContent>
            <ListGroup.ItemTitle className="text-muted font-normal text-sm">
              Signatures
            </ListGroup.ItemTitle>
          </ListGroup.ItemContent>
          <ListGroup.ItemSuffix>
            <AppText className="text-sm font-medium text-foreground">
              {detail.collectedSignatures} of {detail.signatureThreshold}
            </AppText>
          </ListGroup.ItemSuffix>
        </ListGroup.Item>
      </ListGroup>
      <View className="gap-3">
        <AppText className="text-xs text-muted uppercase tracking-wider ml-2">
          Committee signatures
        </AppText>
        <LoanSignatureList signatures={detail.signatures} />
      </View>
      <Button variant="primary" onPress={() => nav.activity.toLoanReview(detail.loanId)}>
        <Button.Label>Review and sign</Button.Label>
      </Button>
    </View>
  );
}

function ApprovedSection({ detail }: { detail: ApprovedLoanDetail }): JSX.Element {
  return (
    <View className="gap-4">
      <ListGroup>
        <ListGroup.Item disabled>
          <ListGroup.ItemContent>
            <ListGroup.ItemTitle className="text-muted font-normal text-sm">
              Approved
            </ListGroup.ItemTitle>
          </ListGroup.ItemContent>
          <ListGroup.ItemSuffix>
            <AppText className="text-sm font-medium text-foreground">
              {formatDate(detail.approvedAt)}
            </AppText>
          </ListGroup.ItemSuffix>
        </ListGroup.Item>
      </ListGroup>
      <View className="bg-info/10 border border-info/20 rounded-2xl p-4 flex-row gap-3 items-start">
        <StyledIonicons name="information-circle-outline" size={20} className="text-info mt-0.5" />
        <AppText className="flex-1 text-sm text-info">
          Disbursement is pending the next Mobile Money window.
        </AppText>
      </View>
    </View>
  );
}

function DisbursedSection({ detail }: { detail: DisbursedLoanDetail }): JSX.Element {
  return (
    <View className="gap-4">
      <ListGroup>
        <ListGroup.Item disabled>
          <ListGroup.ItemContent>
            <ListGroup.ItemTitle className="text-muted font-normal text-sm">
              Disbursed
            </ListGroup.ItemTitle>
          </ListGroup.ItemContent>
          <ListGroup.ItemSuffix>
            <AppText className="text-sm font-medium text-foreground">
              {formatDate(detail.disbursedAt)}
            </AppText>
          </ListGroup.ItemSuffix>
        </ListGroup.Item>
      </ListGroup>
      <View className="gap-3">
        <AppText className="text-xs text-muted uppercase tracking-wider ml-2">Repayment</AppText>
        <RepaymentInfo
          amountPaid={detail.amountPaid}
          totalOwed={detail.totalOwed}
          onAmountPaidPress={() => nav.activity.toLoanRepayments(detail.borrowerUserId)}
        />
      </View>
      <ListGroup>
        <PressableFeedback
          animation={false}
          onPress={() => nav.activity.toDetail(detail.disbursementTransactionId)}
        >
          <PressableFeedback.Scale>
            <ListGroup.Item>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle className="text-accent">
                  View disbursement transaction
                </ListGroup.ItemTitle>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
          </PressableFeedback.Scale>
          <PressableFeedback.Ripple />
        </PressableFeedback>
      </ListGroup>
    </View>
  );
}

function RepayingSection({ detail }: { detail: RepayingLoanDetail }): JSX.Element {
  return (
    <View className="gap-4">
      <View className="gap-3">
        <AppText className="text-xs text-muted uppercase tracking-wider ml-2">Repayment</AppText>
        <RepaymentInfo
          amountPaid={detail.amountPaid}
          totalOwed={detail.totalOwed}
          lastPaymentAt={detail.lastPaymentAt}
          onAmountPaidPress={() => nav.activity.toLoanRepayments(detail.borrowerUserId)}
        />
      </View>
    </View>
  );
}

function RepaidSection({ detail }: { detail: RepaidLoanDetail }): JSX.Element {
  return (
    <View className="gap-4">
      <View className="gap-3">
        <AppText className="text-xs text-muted uppercase tracking-wider ml-2">Repayment</AppText>
        <RepaymentInfo
          amountPaid={detail.totalOwed}
          totalOwed={detail.totalOwed}
          onAmountPaidPress={() => nav.activity.toLoanRepayments(detail.borrowerUserId)}
        />
      </View>
      <AppText className="text-sm text-muted">
        Completed on {formatDate(detail.completedAt)}. Interest contributed to the group reserve.
      </AppText>
    </View>
  );
}

function DefaultedSection({ detail }: { detail: DefaultedLoanDetail }): JSX.Element {
  return (
    <View className="gap-4">
      <AppText className="text-sm text-muted">
        {formatRWF(detail.amountPaidBeforeDefault)} was repaid before default.
      </AppText>
      <ListGroup>
        <ListGroup.Item disabled>
          <ListGroup.ItemContent>
            <ListGroup.ItemTitle className="text-muted font-normal text-sm">
              Remaining balance
            </ListGroup.ItemTitle>
          </ListGroup.ItemContent>
          <ListGroup.ItemSuffix>
            <AppText className="text-sm font-medium text-foreground">
              {formatRWF(detail.remainingBalance)}
            </AppText>
          </ListGroup.ItemSuffix>
        </ListGroup.Item>
        <Separator className="mx-4" />
        <ListGroup.Item disabled>
          <ListGroup.ItemContent>
            <ListGroup.ItemTitle className="text-muted font-normal text-sm">
              Absorbed by
            </ListGroup.ItemTitle>
          </ListGroup.ItemContent>
          <ListGroup.ItemSuffix>
            <AppText className="text-sm font-medium text-foreground">Group reserve</AppText>
          </ListGroup.ItemSuffix>
        </ListGroup.Item>
        <Separator className="mx-4" />
        <ListGroup.Item disabled>
          <ListGroup.ItemContent>
            <ListGroup.ItemTitle className="text-muted font-normal text-sm">
              Reputation impact
            </ListGroup.ItemTitle>
          </ListGroup.ItemContent>
          <ListGroup.ItemSuffix>
            <AppText className="text-sm font-medium text-danger">{detail.reputationImpact}</AppText>
          </ListGroup.ItemSuffix>
        </ListGroup.Item>
      </ListGroup>
    </View>
  );
}

// ── Main screen ─────────────────────────────────────────────────────────

export default function LoanDetailScreen(): JSX.Element {
  const { loanId } = useLocalSearchParams<{ loanId: string }>();
  const { activeGroupId } = useStore($activeGroup);
  const [detail, setDetail] = useState<LoanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    if (!activeGroupId || !loanId) return;
    startTransition(() => setLoading(true));
    api.groups
      .getLoanDetail(activeGroupId, loanId)
      .then(setDetail)
      .catch(() => {})
      .finally(() => startTransition(() => setLoading(false)));
  }, [activeGroupId, loanId]);

  if (loading || !detail) {
    return (
      <ScreenContainer>
        <Header canGoBack />
        <View className="flex-1 items-center justify-center">
          <AppText className="text-muted text-base">Loading...</AppText>
        </View>
      </ScreenContainer>
    );
  }

  const totalOwed =
    detail.currentState === "disbursed" ||
    detail.currentState === "repaying" ||
    detail.currentState === "repaid"
      ? detail.totalOwed
      : undefined;

  return (
    <ScreenContainer>
      <Header title="Loan" canGoBack />
      <ScrollShadow LinearGradientComponent={LinearGradient} className="flex-1">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-36"
        >
          <View className="px-6 pt-4 gap-6">
            {/* Borrower info */}
            <BorrowerInfo
              borrowerUserId={detail.borrowerUserId}
              borrowerName={detail.borrowerName}
              borrowerInitials={detail.borrowerInitials}
              borrowerRole={detail.borrowerRole}
              borrowerJoinedCycle={detail.borrowerJoinedCycle}
            />

            {/* Status row as first item in a ListGroup */}
            <ListGroup>
              <ListGroup.Item disabled>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle className="text-muted font-normal text-sm">
                    Status
                  </ListGroup.ItemTitle>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix>
                  <View className="flex-row items-center gap-2">
                    <Chip
                      variant="secondary"
                      color={LOAN_STATE_CHIP_COLOR[detail.currentState]}
                      size="sm"
                    >
                      <Chip.Label>{LOAN_STATE_LABELS[detail.currentState]}</Chip.Label>
                    </Chip>
                    <Pressable hitSlop={8} onPress={() => setInfoOpen(true)}>
                      <StyledIonicons
                        name="information-circle-outline"
                        size={18}
                        className="text-muted"
                      />
                    </Pressable>
                  </View>
                </ListGroup.ItemSuffix>
              </ListGroup.Item>
            </ListGroup>

            {/* State-specific content */}
            {detail.currentState === "requested" && <RequestedSection detail={detail} />}
            {detail.currentState === "signing" && <SigningSection detail={detail} />}
            {detail.currentState === "approved" && <ApprovedSection detail={detail} />}
            {detail.currentState === "disbursed" && <DisbursedSection detail={detail} />}
            {detail.currentState === "repaying" && <RepayingSection detail={detail} />}
            {detail.currentState === "repaid" && <RepaidSection detail={detail} />}
            {detail.currentState === "defaulted" && <DefaultedSection detail={detail} />}

            {/* Loan terms card */}
            <View className="gap-3">
              <AppText className="text-xs text-muted uppercase tracking-wider ml-2">
                Loan details
              </AppText>
              <LoanTermsCard
                amount={detail.amount}
                interestRate={detail.interestRate}
                totalOwed={totalOwed}
                deadline={detail.deadline}
                purpose={detail.purpose}
              />
            </View>
          </View>
        </ScrollView>
      </ScrollShadow>

      <StatusInfoSheet isOpen={infoOpen} onOpenChange={setInfoOpen} />
    </ScreenContainer>
  );
}
