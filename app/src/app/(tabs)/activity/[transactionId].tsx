import type { ReactNode } from "react";

import type { TransactionDetail } from "@/api";

import { Ionicons } from "@expo/vector-icons";
import { useStore } from "@nanostores/react";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import {
  Button,
  Chip,
  cn,
  ListGroup,
  PressableFeedback,
  ScrollShadow,
  Separator,
  useToast,
} from "heroui-native";
import { Fragment, useCallback, type JSX } from "react";
import { ScrollView, View } from "react-native";
import useSWR from "swr";
import { withUniwind } from "uniwind";

import { api } from "@/api";
import { AppText } from "@/components/ui/app-text";
import { Header } from "@/components/ui/header";
import { ScreenContainer } from "@/components/ui/screen-container";
import {
  STATUS_CHIP_COLOR,
  STATUS_ICON_BG,
  STATUS_ICON_COLOR,
  TRANSACTION_ICONS,
  TRANSACTION_TYPE_FULL_LABELS,
} from "@/lib/activity-constants";
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
      const d = detail;
      return [
        { label: "From", value: d.fromName },
        { label: "Cycle", value: `Cycle ${d.cycle}` },
        { label: "Date", value: dateStr },
        { label: "Method", value: d.method },
        { label: "Reference", value: d.referenceId, mono: true },
      ];
    }
    case "payout": {
      const d = detail;
      return [
        { label: "To", value: d.toName },
        { label: "Cycle", value: `Cycle ${d.cycle}` },
        { label: "Date", value: dateStr },
        { label: "Source", value: d.source },
        { label: "Method", value: d.method },
      ];
    }
    case "penalty": {
      const d = detail;
      return [
        { label: "Member", value: d.memberName },
        { label: "Cycle", value: `Cycle ${d.cycle}` },
        { label: "Reason", value: d.reason },
        { label: "Applied by", value: d.appliedBy },
      ];
    }
    case "loan_repayment": {
      const d = detail;
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
      const d = detail;
      return [
        { label: "To", value: d.toName },
        { label: "Cycle", value: `Cycle ${d.cycle}` },
        { label: "Date", value: dateStr },
        { label: "Method", value: d.method },
      ];
    }
    case "discretionary_deposit":
    case "discretionary_withdrawal":
    default: {
      return [
        { label: "Type", value: detail.type },
        { label: "Date", value: dateStr },
      ];
    }
  }
}

// ── Main screen ─────────────────────────────────────────────────────────

export default function TransactionDetailScreen(): JSX.Element {
  const { transactionId } = useLocalSearchParams<{ transactionId: string }>();
  const { activeGroupId } = useStore($activeGroup);
  const { toast } = useToast();

  const { data: detail, isLoading } = useSWR(
    activeGroupId && transactionId ? `tx:${activeGroupId}:${transactionId}` : null,
    () => api.groups.getTransactionDetail(activeGroupId!, transactionId),
  );

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

  if (isLoading || !detail) {
    return (
      <ScreenContainer>
        <Header canGoBack />
        <View className="flex-1 items-center justify-center">
          <AppText className="text-muted text-base">Loading...</AppText>
        </View>
      </ScreenContainer>
    );
  }

  const statusLabel =
    detail.status === "confirmed"
      ? "Confirmed"
      : detail.status === "pending"
        ? "Pending"
        : "Failed";
  const typeLabel = TRANSACTION_TYPE_FULL_LABELS[detail.type] ?? detail.type;

  const statusRow: DetailRow = {
    label: "Status",
    value: (
      <Chip variant="secondary" color={STATUS_CHIP_COLOR[detail.status]} size="sm">
        <Chip.Label>{statusLabel}</Chip.Label>
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
            <View
              className={cn(
                "size-8 rounded-full items-center justify-center",
                STATUS_ICON_BG[detail.status],
              )}
            >
              <StyledIonicons
                name={TRANSACTION_ICONS[detail.type]}
                size={16}
                className={STATUS_ICON_COLOR[detail.status]}
              />
            </View>
            <AppText className="text-sm">{typeLabel}</AppText>
          </View>
        }
      />
      <ScrollShadow LinearGradientComponent={LinearGradient}>
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
              ),
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
              <StyledIonicons
                name="alert-circle-outline"
                size={20}
                className="text-danger mt-0.5"
              />
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
      </ScrollShadow>
    </ScreenContainer>
  );
}
