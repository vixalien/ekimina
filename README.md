# e-Kimina

A decentralized rotating savings platform for Rwanda, built on the Celo blockchain and accessible via USSD. Members contribute monthly using any feature phone (no internet required), funds are held on-chain, and the pool rotates to one member per round - digitalizing the traditional *ikimina* savings group.

**GitHub:** https://github.com/vixalien/ekimina
**Demo Video:** https://drive.google.com/file/d/1XSszz41XGPqmFxvwDwswy4_iboQAO3xM/view?usp=sharing

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Hono (TypeScript) on Node.js |
| Database | PostgreSQL + Drizzle ORM *(planned)* |
| Blockchain | Solidity on Celo, Viem client |
| USSD gateway | Africa's Talking SDK *(planned)* |
| Payments | MTN MoMo API *(planned)* |
| USSD simulator | Vanilla HTML/JS (local dev tool) |

---

## Architecture

```
Feature phone
     │ dials *950#
     ▼
Africa's Talking  ──POST /ussd──►  Hono Backend  ◄──►  PostgreSQL
                                        │
                                        ▼
                                   Celo Blockchain
                               (Ikimina.sol contract)
```

The backend handles USSD session state and member lookups. On-chain contributions and payouts are executed via the smart contract, which holds funds as cUSD (Celo's stablecoin). Payments are initiated through MTN MoMo and bridged to cUSD on Celo.

---

## Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- (Optional) A Celo wallet with Sepolia cUSD for contract interaction

### Install

```bash
git clone https://github.com/vixalien/ekimina
cd ekimina
pnpm install
```

### Run the USSD simulator

The simulator lets you walk through all USSD flows in a browser without a phone or Africa's Talking account.

```bash
cd test
pnpm dev
# opens at http://localhost:8080
```

Enter a member phone number (e.g. `+250788100001`) or the group leader (`+250788666655`) and dial `*950#`.

### Run the backend

```bash
cd backend
pnpm dev
# API at http://localhost:3000
```

The backend currently uses in-memory mock data. PostgreSQL integration is the next step.

**Available endpoints:**

| Method | Path | Description |
|---|---|---|
| `POST` | `/ussd` | Africa's Talking USSD webhook |
| `GET` | `/members/:phone` | Member lookup by phone |
| `GET` | `/members/:phone/contributions` | Member contribution history |
| `GET` | `/groups/:id` | Group details |
| `GET` | `/groups/:id/members` | Group member list |
| `GET` | `/groups/:id/rotation` | Payout rotation schedule |

### Smart contract

The contract is already deployed to Celo Sepolia testnet:

```
IkiminaModule#Ikimina - 0xf19Ac821098228064d81fe3Bd09e30fa132Ea803
```

View on explorer: https://celo-sepolia.blockscout.com/address/0xf19Ac821098228064d81fe3Bd09e30fa132Ea803

To redeploy:

```bash
cd contract
cp .env.example .env   # add your CELO_SEPOLIA_PRIVATE_KEY
pnpm deploy
```

---

## USSD Navigation

The USSD interface is the primary frontend. All flows begin by dialing `*950#`.

```
*950#
└── Language (1 English / 2 Kinyarwanda / 3 Français)
    └── Main Menu
        ├── 1. Make Contribution
        │   ├── 1. Pay with MTN MoMo
        │   │   └── Confirm → Payment result + reputation update
        │   └── 2. Pay with Airtel Money
        │       └── Confirm → Payment result + reputation update
        ├── 2. My Contributions    (contribution history, all rounds)
        ├── 3. Group Info
        │   ├── 1. Rotation Schedule   (who gets paid each round)
        │   └── 2. Current Round       (pool total, paid count)
        ├── 4. My Reputation
        │   └── 1. What is reputation?
        ├── 5. My Balance              (total contributed, payout estimate)
        └── 6. Manage Group            [group leader only]
            ├── 1. Add Member          (phone → verify MoMo → confirm)
            ├── 2. Set Round Recipient (select member from list)
            ├── 3. Release Payout      (sends pool to recipient on-chain)
            ├── 4. Record Default      (penalises non-paying member -20 rep)
            └── 5. Member List         (all members + reputation scores)
```

Screenshots of each flow are in [`docs/screenshots/`](docs/screenshots/).

---

## Data Model

Planned schema using Drizzle ORM with PostgreSQL:

```ts
// groups
{
  id:                 uuid (PK)
  name:               text
  district:           text
  sector:             text
  contribution_amount: numeric        // in cUSD
  cycle_frequency:    text            // 'monthly' | 'weekly'
  current_round:      integer
  total_rounds:       integer
  round_end_date:     date
  contract_address:   text            // on-chain address
  created_at:         timestamp
}

// members
{
  id:            uuid (PK)
  group_id:      uuid (FK -> groups)
  name:          text
  phone:         text (unique)        // E.164 format
  role:          text                 // 'member' | 'leader'
  reputation:    integer              // 0-100, starts at 50
  payout_round:  integer              // which round they receive the pool
  wallet_address: text               // Celo wallet for on-chain payouts
  created_at:    timestamp
}

// contributions
{
  id:        uuid (PK)
  member_id: uuid (FK -> members)
  round:     integer
  amount:    numeric
  paid_at:   timestamp
  status:    text                    // 'paid' | 'pending' | 'late' | 'defaulted'
}

// rotation
{
  id:        uuid (PK)
  group_id:  uuid (FK -> groups)
  round:     integer
  member_id: uuid (FK -> members)
  status:    text                    // 'pending' | 'current' | 'paid'
  paid_at:   timestamp
}
```

Reputation score is mirrored off-chain from the smart contract for fast reads. The contract is the source of truth for balances and payouts.

---

## Blockchain

**Contract:** `Ikimina.sol` deployed to Celo Sepolia  
**Address:** `0xf19Ac821098228064d81fe3Bd09e30fa132Ea803`  
**Token:** cUSD (Celo Dollar stablecoin, ERC-20)

Key on-chain operations:

| Function | Who | Description |
|---|---|---|
| `registerMember(address)` | Admin | Adds a member, sets reputation to 50 |
| `contribute()` | Member | Transfers cUSD to contract, +5 reputation |
| `setRoundRecipient(round, address)` | Admin | Assigns payout recipient for a round |
| `releasePayout()` | Admin | Sends pool to recipient, advances round |
| `recordDefault(address)` | Admin | Penalises non-paying member, -20 reputation |

Events emitted: `MemberRegistered`, `ContributionMade`, `PayoutReleased`, `DefaultRecorded`

---

## Deployment Plan

| Component | Platform | Status |
|---|---|---|
| Smart contract | Celo Sepolia (testnet) | Deployed |
| Smart contract | Celo Mainnet | Planned (after audit) |
| Backend API | Railway (Node.js) | Planned |
| Database | Railway PostgreSQL | Planned |
| USSD shortcode | Africa's Taking (`*950#`) | Pending subscription |
| MoMo integration | MTN MoMo Sandbox | Planned |

**Steps to production:**
1. Replace in-memory data with Drizzle + PostgreSQL
2. Integrate Africa's Talking USSD SDK for live shortcode
3. Integrate MTN MoMo API for mobile money contributions
4. Deploy backend to Railway, connect to managed PostgreSQL
5. Audit and deploy contract to Celo Mainnet
6. Register USSD shortcode with Rwanda Utilities Regulatory Authority (RURA)
