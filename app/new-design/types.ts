// ============================================================
// types.ts (barrel)
// Convenience re-export. The real split is by plane:
//   primitives.ts  shared scalars + on-chain enums
//   chain.ts       what the contract stores or returns
//   backend.ts     what the off-chain store owns
//   client.ts      merged view-models + facade + computed contract
//
// Prefer importing from the specific plane when it makes the source of
// truth clearer at the call site. This barrel exists only for ergonomics.
// ============================================================

export * from "./primitives";
export * from "./chain";
export * from "./backend";
export * from "./client";
