import type { Ionicons } from "@expo/vector-icons";
import type { LoanState, TransactionStatus, TransactionType } from "../api/types";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

export const TRANSACTION_ICONS: Record<TransactionType, IoniconName> = {
  contribution: "arrow-down-circle-outline",
  payout: "arrow-up-circle-outline",
  penalty: "warning-outline",
  loan_repayment: "return-up-forward-outline",
  loan_disbursement: "cash-outline",
  discretionary_deposit: "wallet-outline",
  discretionary_withdrawal: "receipt-outline",
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  contribution: "Contribution",
  payout: "Payout",
  penalty: "Penalty",
  loan_repayment: "Loan repayment",
  loan_disbursement: "Loan disbursement",
  discretionary_deposit: "Disc. deposit",
  discretionary_withdrawal: "Disc. withdrawal",
};

export const TRANSACTION_TYPE_FULL_LABELS: Record<TransactionType, string> = {
  contribution: "Contribution",
  payout: "Payout",
  penalty: "Penalty",
  loan_repayment: "Loan Repayment",
  loan_disbursement: "Loan Disbursement",
  discretionary_deposit: "Discretionary Deposit",
  discretionary_withdrawal: "Discretionary Withdrawal",
};

export const STATUS_ICON_BG: Record<TransactionStatus, string> = {
  confirmed: "bg-success/10",
  pending: "bg-warning/10",
  failed: "bg-danger/10",
};

export const STATUS_ICON_COLOR: Record<TransactionStatus, string> = {
  confirmed: "text-success",
  pending: "text-warning",
  failed: "text-danger",
};

export const STATUS_CHIP_COLOR: Record<TransactionStatus, "success" | "warning" | "danger"> = {
  confirmed: "success",
  pending: "warning",
  failed: "danger",
};

// ── Loan state constants ──────────────────────────────────────────────

export const LOAN_STATE_LABELS: Record<LoanState, string> = {
  requested: "Requested",
  signing: "Awaiting approval",
  approved: "Approved",
  disbursed: "Disbursed",
  repaying: "Repaying",
  repaid: "Repaid",
  defaulted: "Defaulted",
};

export const LOAN_STATE_CHIP_COLOR: Record<LoanState, "default" | "accent" | "success" | "danger"> =
  {
    requested: "default",
    signing: "accent",
    approved: "success",
    disbursed: "accent",
    repaying: "accent",
    repaid: "success",
    defaulted: "danger",
  };
