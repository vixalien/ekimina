# Design Spec: e-Kimina On-Chain Migration

**Date:** 2026-07-03

## Motivation

Replace the current mock-based app with a real on-chain architecture backed by a Solidity smart contract (Ikimina) and a thin Hono backend serving the OpenAPI spec from `app/new-design/ekimina-api.yaml`. The smart contract becomes the source of truth for money and rules; the backend owns only PII, invite resolution, proposal text, payment intents, and an event indexer.

## 1. Monorepo Package Structure

Add `pnpm-workspace.yaml` to root. Existing packages (`app`, `backend`, `contract`) plus two new workspaces.

| Package | Contents | Dependents |
|---|---|---|
| `packages/types` | Shared TS types from `app/new-design/` (primitives, chain, backend, client) | `app`, `backend` |
| `packages/contracts` | Contract ABIs + viem getContract configs + deploy helpers | `app`, `backend`, `contract` |

```
capstone/
  pnpm-workspace.yaml
  packages/
    types/src/    primitives.ts, chain.ts, backend.ts, client.ts, index.ts
    contracts/    generated.ts, mock-erc20.ts
  app/            imports @ekimina/types, @ekimina/contracts
  backend/        imports @ekimina/types, @ekimina/contracts
  contract/       source of truth for .sol files
```

## 2. Contract Layer

Copy the 495-line factory + per-group contract from `app/new-design/Ikimina.sol` into the `contract/` package. Add a mock ERC20 for local testing. Add Solidity unit tests.

**Contracts:**
- `contracts/contracts/MockUSDm.sol` — minimal mintable ERC20 (18 decimals)
- `contracts/contracts/Ikimina.sol` — per-group contract: config, membership, contributions/penalties, rotating payout, 5-kind proposal governance (loan, discretionary, settings, member_exit, dissolve), loan lifecycle, share-out on dissolve, reentrancy guard
- `contracts/contracts/IkiminaFactory.sol` — deploys Ikimina instances, tracks all groups, holds shared token address

**Tests** (`contracts/contracts/test/Ikimina.t.sol`, Foundry/forge-std):
- Factory deploys group with correct config
- Join with valid invite code succeeds; bad code rejected
- Contribute transfers tokens, records hasPaid
- triggerPayout after cycle end: pays rotating turn, applies penalties to non-payers
- Full proposal lifecycle: create → approve → auto-execute (loan disburses tokens, settings updates config, exit transfers settlement, dissolve share-outs)
- Auto-reject when committeeSize - rejections < threshold
- Loan repay: full repayment advances state to Repaid
- Reentrancy guard blocks reentrant calls

**Deploy:**
- `hardhat.config.ts` — add `localhost:8545` network
- Update `ignition/modules/Ikimina.ts` to deploy MockUSDm → Factory
- Add `scripts/deploy-local.ts` for local hardhat node

## 3. Backend Layer

Rewrite `backend/` to match `ekimina-api.yaml` (932-line OpenAPI 3.1 spec).

**Stack:** Hono + `@hono/zod-openapi` + viem + in-memory stores.

### Route structure

```
backend/src/
  lib/
    chain.ts        viem publicClient + walletClient, contract call wrappers
    indexer.ts      in-memory event cache, polls Ikimina events
    store.ts        in-memory stores for users, group meta, proposal text, payment intents
    auth.ts         OTP generation/verification (mock 123456 for dev)
  routes/
    auth.ts         POST /auth/otp/send, /verify, /pin, /pin/verify
    profile.ts      GET /users/{address}, PATCH /users/me
    lookup.ts       POST /lookup/names, GET /groups/by-invite/{code}
    indexer.ts      GET /users/{address}/groups, /groups/{group}, /cycle, /members, /transactions, /proposals, /loans, /reserve/history
    proposals.ts    GET/POST /proposals/text
    payments.ts     POST /payments/intents, GET /intents/{id}, POST /intents/{id}/retry
    relay.ts        POST /groups/{group}/contribute, /join, /trigger-payout, /repay, /proposals, /proposals/{id}/approve, /proposals/{id}/reject
  index.ts          Hono app + OpenAPI spec generation
```

### Backend behaviors

| Aspect | Implementation |
|---|---|
| Auth OTP | Mock `123456` for dev. Returns `AuthResult` with JWT. First phone creates User + provisions EVM key. |
| Indexer | On startup polls `IkiminaFactory.allGroups()`. Subscribes to events via polling. Caches decoded events in memory. Returns chain types verbatim. |
| Relay (custodial) | Each relay verifies JWT + PIN session, then calls chain via viem WalletClient with the user's backend-custodied key. |
| Proposal text | In-memory key-value store keyed by proposalId. |
| Payments | In-memory intent lifecycle (pending → confirmed/failed). No MoMo integration for MVP. |
| OpenAPI | Routes decorated with `@hono/zod-openapi`. Spec served at `GET /openapi` or build step. |

## 4. App Layer

Replace the mock API layer (`app/src/api/`) with real calls to chain + backend.

**New dependencies:** `viem`, `@ekimina/types`, `@ekimina/contracts`, `hono` (for `hono/client` RPC).

### New file structure

```
app/src/api/
  backend-client.ts     hono/rpc typed client -> backend
  chain-client.ts       viem WalletClient -> hardhat node
  custody.ts            expo-secure-store key mgmt (importAccount, unlock, currentAddress)
  data-client.ts        DataClient facade combining chain + backend
  index.ts              exports dataClient singleton
```

### Data flow

- **Reads** → always through backend indexer via `hono/rpc`
- **Non-custodial writes** → viem WalletClient with device key → hardhat node
- **Custodial writes** → backend relay API (backend signs with user's key)

### Key management

- `CustodyApi.importAccount(secret, pin)` — encrypts private key with PIN, stores in `expo-secure-store`
- `CustodyApi.unlock(pin)` — decrypts key, creates viem account in memory
- `CustodyApi.currentAddress()` — returns address if key exists

### Screen migration

- Replace `import { api } from "../../api"` with `import { dataClient } from "../../api"`
- Replace `app/src/api/types.ts` imports with `@ekimina/types`
- Member names resolve via `dataClient.lookup.resolveNames()` instead of baked-in mock data
- Amounts use `BaseUnit` strings; format at UI edge with `toDisplay()`
- All 30+ screens updated to new type shapes

### Navigation impact

- Auth flow uses address-based identity instead of phone
- CustodyApi replaces direct key management in onboarding
- Group switcher uses GroupMeta (address-based) instead of string IDs

## 5. Migration Order

```
1. pnpm-workspace.yaml + packages/types + packages/contracts
2. Replace contract/ Ikimina.sol with new design + tests
3. Rewrite backend/ with Hono OpenAPI + viem
4. Deploy to local hardhat node
5. Rewrite app/src/api/ with DataClient facade
6. Update all 30+ screens to new types
7. Remove old mock data files
8. End-to-end verification
```
