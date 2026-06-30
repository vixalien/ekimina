import { Ionicons } from "@expo/vector-icons";
import { useStore } from "@nanostores/react";
import { Button, Chip, cn, ListGroup, PressableFeedback, Separator, useToast } from "heroui-native";
import { Fragment, ReactNode, type JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { withUniwind } from "uniwind";
import { api } from "@/api";
import type {
  ContributionDetail,
  DiscretionaryDetail,
  LoanDisbursementDetail,
  LoanRepaymentDetail,
  PayoutDetail,
  PenaltyDetail,
  TransactionDetail,
  TransactionStatus,
} from "@/api/types";
import { Header } from "@/components/ui/header";
import { ScreenContainer } from "@/components/ui/screen-container";
import { AppText } from "@/components/ui/app-text";
import { formatRWF } from "@/lib/strings";
import { $activeGroup } from "@/stores/active-group";

const StyledIonicons = withUniwind(Ionicons);

// ── Detail row types ────────────────────────────────────────────────────

interface DetailRow {
  label: string;
  value: ReactNode;
  mono?: boolean;
  tappable?: boolean;
  onPress?: () => void;
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString("en-RW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildDetailRows(detail: TransactionDetail): DetailRow[] {
  const dateStr = formatDate(detail.timestamp);

  switch (detail.type) {
    case "contribution": {
      const d = detail as ContributionDetail;
      return [
        { label: "From", value: d.fromName },
        { label: "Cycle", value: `Cycle ${d.cycle}` },
        { label: "Date", value: dateStr },
        { label: "Method", value: d.method },
        { label: "Reference", value: d.referenceId, mono: true },
      ];
    }
    case "payout": {
      const d = detail as PayoutDetail;
      return [
        { label: "To", value: d.toName },
        { label: "Cycle", value: `Cycle ${d.cycle}` },
        { label: "Date", value: dateStr },
        { label: "Source", value: d.source },
        { label: "Method", value: d.method },
      ];
    }
    case "penalty": {
      const d = detail as PenaltyDetail;
      return [
        { label: "Member", value: d.memberName },
        { label: "Cycle", value: `Cycle ${d.cycle}` },
        { label: "Reason", value: d.reason },
        { label: "Applied by", value: d.appliedBy },
      ];
    }
    case "loan_repayment": {
      const d = detail as LoanRepaymentDetail;
      return [
        { label: "Borrower", value: d.memberName },
        { label: "Installment", value: `${d.installmentNumber} of ${d.totalInstallments}` },
        { label: "Cycle", value: `Cycle ${d.cycle}` },
        { label: "Date", value: dateStr },
        { label: "Method", value: d.method },
        { label: "View linked loan", value: "", tappable: true },
      ];
    }
    case "loan_disbursement": {
      const d = detail as LoanDisbursementDetail;
      return [
        { label: "To", value: d.toName },
        { label: "Cycle", value: `Cycle ${d.cycle}` },
        { label: "Date", value: dateStr },
        { label: "Method", value: d.method },
      ];
    }
    case "discretionary_deposit":
    case "discretionary_withdrawal": {
      const d = detail as DiscretionaryDetail;
      const isDeposit = d.type === "discretionary_deposit";
      return [
        { label: "Direction", value: isDeposit ? "Deposit" : "Withdrawal" },
        { label: "Category", value: d.category },
        { label: isDeposit ? "Received from" : "Paid to", value: d.counterparty },
        { label: "Reason", value: d.reason },
        { label: "Approved by", value: d.approvedBy },
        { label: "Date", value: dateStr },
      ];
    }
  }
}

// ── Status badge config ─────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  TransactionStatus,
  { label: string; color: "success" | "warning" | "danger" }
> = {
  confirmed: { label: "Confirmed", color: "success" },
  pending: { label: "Pending", color: "warning" },
  failed: { label: "Failed", color: "danger" },
};

const TRANSACTION_TYPE_FULL_LABELS: Record<string, string> = {
  contribution: "Contribution",
  payout: "Payout",
  penalty: "Penalty",
  loan_repayment: "Loan Repayment",
  loan_disbursement: "Loan Disbursement",
  discretionary_deposit: "Discretionary Deposit",
  discretionary_withdrawal: "Discretionary Withdrawal",
};

const TRANSACTION_ICONS: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  contribution: "arrow-down-circle-outline",
  payout: "arrow-up-circle-outline",
  penalty: "warning-outline",
  loan_repayment: "return-up-forward-outline",
  loan_disbursement: "cash-outline",
  discretionary_deposit: "wallet-outline",
  discretionary_withdrawal: "receipt-outline",
};

const STATUS_ICON_BG: Record<TransactionStatus, string> = {
  confirmed: "bg-accent/10",
  pending: "bg-warning/10",
  failed: "bg-danger/10",
};

const STATUS_ICON_COLOR: Record<TransactionStatus, string> = {
  confirmed: "text-accent",
  pending: "text-warning",
  failed: "text-danger",
};

// ── Main screen ─────────────────────────────────────────────────────────

export default function TransactionDetailScreen(): JSX.Element {
  const { transactionId } = useLocalSearchParams<{ transactionId: string }>();
  const { activeGroupId } = useStore($activeGroup);
  const { toast } = useToast();

  const [detail, setDetail] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeGroupId || !transactionId) return;
    api.groups
      .getTransactionDetail(activeGroupId, transactionId)
      .then((d) => {
        setDetail(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeGroupId, transactionId]);

  const handleRetry = useCallback(async () => {
    if (!transactionId) return;
    const id = toast.show({
      variant: "default",
      label: "Retrying payment...",
      duration: "persistent",
    });
    try {
      await api.groups.retryTransaction(transactionId);
      toast.hide(id);
      toast.show({
        variant: "success",
        label: "Payment submitted",
        description: "You'll see it confirmed shortly.",
      });
    } catch {
      toast.hide(id);
      toast.show({
        variant: "danger",
        label: "Retry failed",
        description: "Please check your MTN MoMo balance.",
      });
    }
  }, [transactionId, toast]);

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

  const statusCfg = STATUS_CONFIG[detail.status];
  const typeLabel = TRANSACTION_TYPE_FULL_LABELS[detail.type] ?? detail.type;

  const statusRow: DetailRow = {
    label: "Status",
    value: (
      <Chip variant="secondary" color={statusCfg.color} size="sm">
        <Chip.Label>{statusCfg.label}</Chip.Label>
      </Chip>
    ),
  };

  const detailRows = [statusRow, ...buildDetailRows(detail)];

  return (
    <ScreenContainer>
      <Header
        canGoBack
        title={
          <View className="flex-row items-center gap-2">
            <View className={cn("rounded-full items-center justify-center")}>
              <StyledIonicons name={TRANSACTION_ICONS[detail.type]} size={24} />
            </View>
            <AppText className="text-sm">{typeLabel}</AppText>
          </View>
        }
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="p-4 gap-6">
        {/* Status + icon + amount header */}
        <View className="w-full justify-between items-baseline gap-4">
          <AppText className="text-foreground font-hero text-4xl">
            {formatRWF(detail.amount)}
          </AppText>
        </View>

        {/* Detail card */}
        <ListGroup>
          {detailRows.map((row, index) =>
            row.tappable ? (
              <Fragment key={row.label}>
                {index > 0 && <Separator className="mx-4" />}
                <PressableFeedback animation={false} onPress={row.onPress ?? (() => {})}>
                  <PressableFeedback.Scale>
                    <ListGroup.Item>
                      <ListGroup.ItemContent>
                        <ListGroup.ItemTitle className="text-accent">
                          {row.label}
                        </ListGroup.ItemTitle>
                      </ListGroup.ItemContent>
                      <ListGroup.ItemSuffix />
                    </ListGroup.Item>
                  </PressableFeedback.Scale>
                  <PressableFeedback.Ripple />
                </PressableFeedback>
              </Fragment>
            ) : (
              <Fragment key={row.label}>
                {index > 0 && <Separator className="mx-4" />}
                <ListGroup.Item>
                  <ListGroup.ItemContent>
                    <ListGroup.ItemTitle className="text-muted font-normal text-sm">
                      {row.label}
                    </ListGroup.ItemTitle>
                  </ListGroup.ItemContent>
                  <ListGroup.ItemSuffix>
                    {typeof row.value === "string" ? (
                      <AppText
                        className={`text-sm font-medium text-foreground text-right max-w-[180px]${row.mono ? " font-mono" : ""}`}
                        numberOfLines={2}
                      >
                        {row.value}
                      </AppText>
                    ) : (
                      row.value
                    )}
                  </ListGroup.ItemSuffix>
                </ListGroup.Item>
              </Fragment>
            )
          )}
        </ListGroup>

        {/* Pending info box */}
        {detail.status === "pending" && (
          <View className="bg-warning/10 border border-warning/20 rounded-2xl p-4 flex-row gap-3 items-start">
            <StyledIonicons name="time-outline" size={20} className="text-warning mt-0.5" />
            <AppText className="flex-1 text-sm text-warning">
              Waiting on Mobile Money confirmation. This usually takes under a minute.
            </AppText>
          </View>
        )}

        {/* Failed info box */}
        {detail.status === "failed" && detail.failureReason && (
          <View className="bg-danger/10 border border-danger/20 rounded-2xl p-4 flex-row gap-3 items-start">
            <StyledIonicons name="alert-circle-outline" size={20} className="text-danger mt-0.5" />
            <AppText className="flex-1 text-sm text-danger">{detail.failureReason}</AppText>
          </View>
        )}

        {/* Confirmed contextual note */}
        {detail.status === "confirmed" && detail.contextNote && (
          <AppText className="text-sm text-muted text-center">{detail.contextNote}</AppText>
        )}

        {/* Failed: Try again */}
        {detail.status === "failed" && (
          <Button variant="primary" onPress={handleRetry}>
            <Button.Label>Try again</Button.Label>
          </Button>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
