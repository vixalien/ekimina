// ============================================================
// primitives.ts
// Shared vocabulary used by every plane. No stored data lives here,
// only scalar brands and the enums the contract enforces.
// ============================================================

export type Address = `0x${string}`;

/** uint256 token amount in base units (USDm). Never a JS number. bigint in logic, format at UI edge. */
export type BaseUnit = string & { readonly __brand: "BaseUnit" };

/** basis points, 0..10000 */
export type Bps = number;

/** ISO-8601. On chain these are uint timestamps; the indexer normalizes to ISO. */
export type ISODate = string;

// ---- On-chain enums (the contract's own vocabulary) --------

export type PayoutPolicy = "none" | "rotating" | "lump_sum_end";

export type ProposalKind = "loan" | "discretionary" | "settings" | "member_exit" | "dissolve";

export type ProposalState = "pending" | "approved" | "rejected" | "executed";

export type LoanState = "disbursed" | "repaying" | "repaid" | "defaulted";

export type TransactionType =
  | "contribution"
  | "payout"
  | "penalty"
  | "loan_disbursement"
  | "loan_repayment"
  | "discretionary_disbursement"
  | "share_out"
  | "member_joined"
  | "member_exited";
