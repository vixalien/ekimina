import type { Ionicons } from "@expo/vector-icons";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

export const TRANSACTION_ICONS: Record<string, IoniconName> = {
  contribution: "arrow-down-circle-outline",
  payout: "arrow-up-circle-outline",
  penalty: "warning-outline",
  loan_repayment: "return-up-forward-outline",
  loan_disbursement: "cash-outline",
  discretionary_disbursement: "wallet-outline",
  share_out: "gift-outline",
  member_joined: "person-add-outline",
  member_exited: "person-remove-outline",
};

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  contribution: "Contribution",
  payout: "Payout",
  penalty: "Penalty",
  loan_repayment: "Loan repayment",
  loan_disbursement: "Loan disbursement",
  discretionary_disbursement: "Discretionary",
  share_out: "Share out",
  member_joined: "Joined",
  member_exited: "Exited",
};

export const TRANSACTION_TYPE_FULL_LABELS: Record<string, string> = {
  contribution: "Contribution",
  payout: "Payout",
  penalty: "Penalty",
  loan_repayment: "Loan Repayment",
  loan_disbursement: "Loan Disbursement",
  discretionary_disbursement: "Discretionary Disbursement",
  share_out: "Share Out",
  member_joined: "Member Joined",
  member_exited: "Member Exited",
};

export const STATUS_ICON_BG: Record<string, string> = {
  confirmed: "bg-success/10",
  pending: "bg-warning/10",
  failed: "bg-danger/10",
};

export const STATUS_ICON_COLOR: Record<string, string> = {
  confirmed: "text-success",
  pending: "text-warning",
  failed: "text-danger",
};

export const STATUS_CHIP_COLOR: Record<string, "success" | "warning" | "danger"> = {
  confirmed: "success",
  pending: "warning",
  failed: "danger",
};

// ── Loan state constants ──────────────────────────────────────────────

export const LOAN_STATE_LABELS: Record<string, string> = {
  disbursed: "Disbursed",
  repaying: "Repaying",
  repaid: "Repaid",
  defaulted: "Defaulted",
};

export const LOAN_STATE_CHIP_COLOR: Record<string, "default" | "accent" | "success" | "danger"> = {
  disbursed: "accent",
  repaying: "accent",
  repaid: "success",
  defaulted: "danger",
};
