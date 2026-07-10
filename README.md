# e-Kimina

A decentralized rotating savings platform for Rwanda. The smart contract is the source of truth for money and rules; a thin Hono backend handles auth, identity, and cached chain reads. The mobile app (Expo + HeroUI Native) lets members create groups, join instantly via invite code or public discovery, contribute, receive rotating payouts, request and repay loans, and govern through on-chain proposals.

---

## Demo & Downloads

|                 |                                                                                                                       |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Demo Video**  | [Click to watch](https://docs.google.com/document/d/1hh0rzbc85W_atN-yufezJGftzqN5Ga_EKejYr0Odemk/edit?usp=sharing)    |
| **Android APK** | [Click to download](https://docs.google.com/document/d/1KAmPYivJRzuYNXhqU8aLkjQPi_Fv_FpgW1UdctpvZnI/edit?usp=sharing) |

---

## Architecture

```
Mobile App (Expo + HeroUI Native)
     │ viem WalletClient (non-custodial) / hono/rpc (custodial)
     ▼
Hono Backend ──► Hardhat node (local) / Celo (testnet)
     │
     ├─ Auth (OTP + JWT)
     ├─ Profile / Lookup
     ├─ Indexer (cached chain reads)
     └─ Relay (custodial transaction relay)
```

The **Ikimina** contract controls contributions, rotating payouts, proposal governance (loans, settings, member exit, dissolve), and loan lifecycle. The backend owns only PII, invite codes, proposal text, and an event indexer. The app signs directly to the chain (non-custodial) or relays through the backend (custodial phone/USSD path).

---

## Project layout

```
capstone/
  packages/
    types/src/        Shared TypeScript types (primitives → chain → backend → client)
    contracts/        Solidity contracts + Forge tests + deploy scripts
      contracts/
        Ikimina.sol   Per-group contract (governance, loans, rotation)
        MockUSDm.sol  Test ERC20 for local development
      test/
        Ikimina.t.sol Solidity unit tests (forge-std)
  backend/            Hono OpenAPI server with viem chain integration
  app/                Expo Router mobile app (HeroUI Native + Uniwind)
```

---

## Setup

### Prerequisites

- Node.js 20+, pnpm 9+
- A Celo wallet with Sepolia cUSD for live testnet (optional for local dev)

### Install

```bash
git clone https://github.com/vixalien/ekimina
cd ekimina
pnpm install
```

---

## Running locally

You need four terminals for the full stack.

### Terminal 1 — Hardhat node

```bash
cd packages/contracts
pnpm dev:node
```

Runs an EVM node on `localhost:8545` with pre-funded accounts.

### Terminal 2 — Deploy contracts

```bash
cd packages/contracts
pnpm dev:deploy
```

Prints `FACTORY_ADDRESS=0x...`. Save this value.

### Terminal 3 — Backend

```bash
cd backend
FACTORY_ADDRESS=0x<address-from-step-2> pnpm dev
```

Starts the Hono API server on `http://localhost:3000`. Endpoints:

| Method  | Path                                   | Description                    |
| ------- | -------------------------------------- | ------------------------------ |
| `POST`  | `/auth/otp/send`                       | Send OTP (mock: `123456`)      |
| `POST`  | `/auth/otp/verify`                     | Verify OTP, returns JWT + user |
| `POST`  | `/auth/pin`                            | Set custodial PIN              |
| `POST`  | `/auth/pin/verify`                     | Verify PIN                     |
| `GET`   | `/users/{address}`                     | Get user by address            |
| `PATCH` | `/users/me`                            | Update profile                 |
| `POST`  | `/lookup/names`                        | Resolve addresses to names     |
| `GET`   | `/groups/by-invite/{code}`             | Lookup group by invite code    |
| `GET`   | `/users/{address}/groups`              | User's group memberships       |
| `GET`   | `/groups/{group}`                      | Group config                   |
| `GET`   | `/groups/{group}/cycle`                | Current cycle state            |
| `GET`   | `/groups/{group}/members`              | Active member list             |
| `POST`  | `/relay/groups/{group}/contribute`     | Contribute (custodial)         |
| `POST`  | `/relay/join`                          | Join by invite code (instant)  |
| `POST`  | `/relay/groups/{group}/join-by-id`     | Join public group by ID        |
| `POST`  | `/relay/groups/{group}/trigger-payout` | Advance payout (custodial)     |

### Terminal 4 — Mobile app

```bash
cd app
pnpm expo start
```

Opens the Expo dev server. Use mock OTP `123456` to log in.

---

## Smart contract

The `Ikimina` contract (per-group) manages contributions, rotating payouts, proposal governance, and loans. The `IkiminaFactory` deploys new group contracts.

**Key governance flows (all via on-chain proposals):**

| Proposal kind   | What happens                                         |
| --------------- | ---------------------------------------------------- |
| `loan`          | Disburses tokens to borrower, creates a loan         |
| `discretionary` | Disburses tokens to a recipient                      |
| `settings`      | Updates group config (contribution, penalties, etc.) |
| `member_exit`   | Removes member, pays settlement                      |
| `dissolve`      | Shares out reserve equally, closes group             |

Proposals auto-execute at threshold and auto-reject when approval becomes impossible. No manual execution needed.

### Tests

```bash
cd packages/contracts
pnpm test
```

11 Solidity unit tests covering factory deploy, join, contribute, trigger payout, penalties, proposal lifecycle (create → approve → auto-execute), auto-reject, loan repay, and dissolve.

---

## Tech Stack

| Layer          | Technology                                    |
| -------------- | --------------------------------------------- |
| Mobile app     | Expo 57, HeroUI Native, Uniwind (Tailwind v4) |
| Backend        | Hono + `@hono/zod-openapi` + viem             |
| Smart contract | Solidity 0.8.28, Hardhat 3, forge-std         |
| Key management | viem WalletClient + Expo AsyncStorage         |
| State          | Nanostores                                    |
