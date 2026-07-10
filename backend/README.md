# e-Kimina Backend

REST API server for the e-Kimina decentralized savings platform. Built with [Hono](https://hono.dev/), [Drizzle ORM](https://orm.drizzle.team/), and [viem](https://viem.sh/).

## Architecture

The backend acts as a **relay layer** between the mobile app and the blockchain. It:

- Manages user auth (OTP + JWT)
- Reads group/loan/contribution data from the chain via viem
- Relays blockchain transactions through a custodial wallet
- Syncs chain state via a polling indexer
- Stores user metadata and app state in PostgreSQL

**Important:** The app has no direct blockchain dependency. All chain interaction is proxied through this backend.

## Setup

**Prerequisites:** Node 22+, PostgreSQL 16+, pnpm

```bash
# Install
pnpm install

# Setup database
createdb ekimina
pnpm db:push
pnpm db:seed

# Copy env
cp .env.example .env
# Edit .env with your settings
```

## Environment Variables

| Variable          | Default                                             | Description                                         |
| ----------------- | --------------------------------------------------- | --------------------------------------------------- |
| `DATABASE_URL`    | `postgres://ekimina:ekimina@localhost:5432/ekimina` | PostgreSQL connection                               |
| `RPC_URL`         | `http://127.0.0.1:8545`                             | Blockchain RPC endpoint                             |
| `CHAIN_ID`        | `31337`                                             | Chain ID (31337 = hardhat, 11142220 = Celo Sepolia) |
| `PRIVATE_KEY`     | Hardhat account #0                                  | Backend wallet private key                          |
| `FACTORY_ADDRESS` | —                                                   | IkiminaFactory address (overrides `local.json`)     |
| `JWT_SECRET`      | `dev-secret-ekimina-2026`                           | JWT signing secret (required in production)         |
| `OTP_PROVIDER`    | `mock`                                              | OTP provider (`mock`, `twilio`, `africastalking`)   |
| `NODE_ENV`        | —                                                   | Set to `production` to enforce JWT_SECRET           |

## Development

```bash
# Start with hot reload
pnpm dev

# Database
pnpm db:push      # Push schema changes
pnpm db:migrate   # Run migrations
pnpm db:generate  # Generate migration
pnpm db:seed      # Seed demo data

# Type checking
pnpm typecheck

# Tests
pnpm test

# Build
pnpm build
```

### Full Stack

Requires a local chain running. From repo root:

```bash
cd packages/contracts && pnpm dev
```

This starts Anvil and deploys the IkiminaFactory. The backend reads the factory address from `local.json`.

## API

- OpenAPI spec: `http://localhost:3000/openapi.json`
- Scalar UI: `http://localhost:3000/scalar`

### Auth

```
POST /auth/otp/send     # Request OTP (mock: always "123456")
POST /auth/otp/verify   # Verify OTP, returns JWT
```

All authenticated endpoints require `Authorization: Bearer <jwt>` header.

### Groups

```
GET  /groups/public                     # List public groups
GET  /groups/:group/dashboard           # Group dashboard
GET  /groups/:group/members             # Member list
GET  /groups/:group/members/:userId     # Member detail
GET  /groups/:group/loans               # Loan list
GET  /groups/:group/loans/:id           # Loan detail
GET  /groups/:group/loans/:id/review    # Loan review with signatures
GET  /groups/:group/committee           # Committee members
GET  /groups/:group/settings            # Group settings
GET  /groups/:group/invite              # Invite code & links
GET  /groups/:group/reserve             # Reserve details
GET  /groups/:group/pending             # Pending requests
GET  /groups/:group/cycle               # Cycle state
GET  /groups/:group/proposals           # Proposal list
GET  /groups/:group/leave-info          # Leave eligibility
POST /groups                           # Create group
POST /groups/join-by-code              # Join via invite code
POST /groups/join-requests             # Request to join
```

### Relay (signed transactions)

```
POST /relay/groups/:group/contribute       # Pay contribution
POST /relay/groups/:group/join             # Join group
POST /relay/groups/:group/trigger-payout   # Trigger payout
POST /relay/groups/:group/rotate           # Set rotation order
POST /relay/groups/:group/repay-loan       # Repay loan
POST /relay/groups/:group/share-out        # Execute share-out
```

### Mutations

```
POST /groups/:group/loans/:id/sign                      # Sign loan approval
POST /groups/:group/loans/:id/reject                     # Reject loan
POST /groups/:group/settings/changes                     # Submit settings change
POST /groups/:group/settings/changes/:id/sign            # Sign settings change
POST /groups/:group/discretionary                        # Submit discretionary fund request
POST /groups/:group/discretionary/:id/sign               # Sign discretionary request
POST /groups/:group/join-requests/:id/sign               # Sign join request
POST /groups/:group/withdrawals                          # Initiate member withdrawal
POST /groups/:group/withdrawals/:id/sign                 # Sign withdrawal
POST /groups/:group/leave                                # Leave group (not implemented)
POST /groups/:group/invite/phone                         # Send SMS invite (not implemented)
```

### Profile

```
GET  /users/:address     # Get user by address
PATCH /users/me          # Update profile (requires auth)
POST /users/notifications # Update notification settings
```

### USSD

```
POST /ussd    # USSD gateway (mock data, *950#)
```

### Payments

```
POST /payments/intents            # Create payment intent
GET  /payments/intents/:id        # Get payment intent
POST /payments/intents/:id/retry  # Retry payment intent
```

## Deployment

### Celo Sepolia (testnet)

1. Set env vars:

   ```
   RPC_URL=https://forno.celo-sepolia.celo-testnet.org/
   CHAIN_ID=11142220
   PRIVATE_KEY=0x...
   FACTORY_ADDRESS=0x...  # Deployed factory on Celo Sepolia
   JWT_SECRET=<strong-secret>
   NODE_ENV=production
   ```

2. Build and start:
   ```bash
   pnpm build
   pnpm start
   ```

### Production Checklist

- [ ] Set a strong `JWT_SECRET`
- [ ] Set `NODE_ENV=production`
- [ ] Use a dedicated wallet private key (not the Anvil default)
- [ ] Configure PostgreSQL with SSL
- [ ] Enable rate limiting (behind reverse proxy)
- [ ] Set up monitoring and logging
- [ ] Configure backup for PostgreSQL
- [ ] Run database migrations on deploy

## Project Structure

```
src/
  index.ts              Server entry point
  lib/
    chain.ts            Blockchain client config (env-driven)
    auth.ts             OTP + JWT auth logic
    contract-data.ts    Chain read functions
    indexer.ts          Chain polling indexer
    name-resolver.ts    Address → name resolution
    schemas.ts          Zod schemas for API
    store.ts            DB query re-exports
    db/
      schema.ts         Drizzle table definitions
      queries.ts        SQL query functions
      seed.ts           Demo data seeder
      migrations/       Drizzle Kit migrations
  routes/
    auth.ts             Auth endpoints
    groups.ts           Group data endpoints
    indexer.ts          Indexer/cache endpoints
    mutations.ts        Mutation endpoints (sign, submit, etc.)
    payments.ts         Payment intent endpoints
    profile.ts          User profile endpoints
    relay.ts            Blockchain relay endpoints
    lookup.ts           Name/address lookup
    ussd.ts             USSD gateway
  ussd/
    screens.ts          USSD screen definitions
    members.ts          Mock USSD data
    types.ts            USSD type definitions
  __tests__/
    mock-store.ts       In-memory store for tests
    setup.ts            Test setup
```
