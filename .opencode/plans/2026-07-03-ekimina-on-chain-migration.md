# e-Kimina On-Chain Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace mock-based app with real on-chain architecture: Solidity contract (Ikimina), Hono OpenAPI backend, and viem-based app client.

**Architecture:** Three-plane type system (primitives → chain → backend → client). Shared packages for types and contract ABIs. Backend serves OpenAPI spec with hono/rpc typed client. App uses viem WalletClient for direct chain writes (non-custodial) and backend relay for custodial writes.

**Tech Stack:** Solidity 0.8.28, Hardhat 3 + forge-std, Hono 4 + `@hono/zod-openapi` + viem 2, Expo 57 + viem WalletClient + expo-secure-store

---

## File Structure

```
capstone/
  pnpm-workspace.yaml                              # CREATE: workspace config
  packages/
    types/src/
      primitives.ts                                 # CREATE: from app/new-design/primitives.ts
      chain.ts                                      # CREATE: from app/new-design/chain.ts
      backend.ts                                    # CREATE: from app/new-design/backend.ts
      client.ts                                     # CREATE: from app/new-design/client.ts
      index.ts                                      # CREATE: barrel export
    types/package.json                              # CREATE: @ekimina/types
    contracts/src/
      generated.ts                                  # CREATE: viem getContract configs
      mock-erc20.ts                                 # CREATE: mock ERC20 deploy helper
    contracts/package.json                          # CREATE: @ekimina/contracts
  contract/
    contracts/
      Ikimina.sol                                   # REPLACE: new factory + per-group contract
      MockUSDm.sol                                  # CREATE: simple ERC20
    contracts/test/
      Ikimina.t.sol                                 # CREATE: forge-std unit tests
    hardhat.config.ts                               # UPDATE: add localhost network
    ignition/modules/Ikimina.ts                     # UPDATE: deploy MockUSDm + Factory
    scripts/deploy-local.ts                         # CREATE: local hardhat node deploy
  backend/
    src/
      lib/
        chain.ts                                    # CREATE: viem contract wrappers
        indexer.ts                                  # CREATE: in-memory event cache
        store.ts                                    # CREATE: in-memory stores
        auth.ts                                     # CREATE: mock OTP + JWT
      routes/
        auth.ts                                     # CREATE: auth endpoints
        profile.ts                                  # CREATE: profile endpoints
        lookup.ts                                   # CREATE: lookup endpoints
        indexer.ts                                  # CREATE: indexer endpoints
        proposals.ts                                # CREATE: proposal text endpoints
        payments.ts                                 # CREATE: payment intent endpoints
        relay.ts                                    # CREATE: relay endpoints
      index.ts                                      # CREATE: Hono app entry
    package.json                                    # REPLACE: new deps
  app/
    src/api/
      backend-client.ts                             # CREATE: hono/rpc client
      chain-client.ts                               # CREATE: viem WalletClient
      custody.ts                                    # CREATE: secure-store key mgmt
      data-client.ts                                # CREATE: DataClient facade
      index.ts                                      # REPLACE: exports dataClient
      types.ts                                      # DELETE: replaced by @ekimina/types
      mock/                                         # DELETE: replaced by real client
      auth.ts                                       # DELETE: replaced
      groups.ts                                     # DELETE: replaced
    package.json                                    # UPDATE: add viem, @ekimina/*
```

---

### Task 1: Set up monorepo workspaces + shared packages

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `packages/types/package.json`
- Create: `packages/types/src/primitives.ts`
- Create: `packages/types/src/chain.ts`
- Create: `packages/types/src/backend.ts`
- Create: `packages/types/src/client.ts`
- Create: `packages/types/src/index.ts`
- Create: `packages/contracts/package.json`
- Create: `packages/contracts/src/generated.ts`
- Create: `packages/contracts/src/mock-erc20.ts`

- [ ] **Step 1: Create pnpm-workspace.yaml**

```yaml
packages:
  - "packages/*"
  - "app"
  - "backend"
  - "contract"
```

- [ ] **Step 2: Create packages/types/package.json**

```json
{
  "name": "@ekimina/types",
  "version": "0.1.0",
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

- [ ] **Step 3: Create packages/types/src/primitives.ts**

Copy verbatim from `app/new-design/primitives.ts` (37 lines) — Address, BaseUnit, Bps, ISODate, PayoutPolicy, ProposalKind, ProposalState, LoanState, TransactionType.

- [ ] **Step 4: Create packages/types/src/chain.ts**

Copy verbatim from `app/new-design/chain.ts` (225 lines) — Group, GroupCycle, GroupMember, Approval, ChainProposal (discriminated union), GroupLoan, Transaction (discriminated union), TransactionFilters, ReservePoint, ChainWriteApi. Update import path to `./primitives`.

- [ ] **Step 5: Create packages/types/src/backend.ts**

Copy verbatim from `app/new-design/backend.ts` (135 lines) — User, GroupMeta, ProposalText, PaymentIntent, AuthResult, AuthApi, ProfileApi, LookupApi, PaymentApi, ProposalTextApi, IndexerApi. Update import paths to `./primitives` and `./chain`.

- [ ] **Step 6: Create packages/types/src/client.ts**

Copy verbatim from `app/new-design/client.ts` (186 lines) — Group, CycleState, Member, Loan, DisplayAmount, ProposalView, ProposalDraft, CustodyApi, GroupReads, GroupActions, DataClient, computed contract docs. Update import paths to `./primitives`, `./chain`, `./backend`.

- [ ] **Step 7: Create packages/types/src/index.ts**

```typescript
export * from "./primitives";
export * from "./chain";
export * from "./backend";
export * from "./client";
```

- [ ] **Step 8: Create packages/contracts/package.json**

```json
{
  "name": "@ekimina/contracts",
  "version": "0.1.0",
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "viem": "^2.52.0"
  }
}
```

- [ ] **Step 9: Create packages/contracts/src/mock-erc20.ts**

```typescript
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";

const MOCK_ERC20_ABI = [
  { type: "constructor", inputs: [{ name: "name", type: "string" }, { name: "symbol", type: "string" }, { name: "decimals", type: "uint8" }], stateMutability: "nonpayable" },
  { type: "function", name: "mint", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }], stateMutability: "public" },
  { type: "function", name: "approve", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }], stateMutability: "public" },
  { type: "function", name: "balanceOf", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "transfer", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }], stateMutability: "public" },
  { type: "function", name: "transferFrom", inputs: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }], stateMutability: "public" },
  { type: "function", name: "decimals", inputs: [], outputs: [{ name: "", type: "uint8" }], stateMutability: "view" },
  { type: "event", name: "Transfer", inputs: [{ name: "from", type: "address", indexed: true }, { name: "to", type: "address", indexed: true }, { name: "value", type: "uint256", indexed: false }] },
] as const;

const MOCK_ERC20_BYTECODE = "0x608060..."; // placeholder — will be set after compiling MockUSDm.sol

export async function deployMockERC20(client: ReturnType<typeof createWalletClient>) {
  const hash = await client.deployContract({
    abi: MOCK_ERC20_ABI,
    bytecode: MOCK_ERC20_BYTECODE,
    args: ["MockUSDm", "USDM", 18],
  });
  return hash;
}
```

> Note: After compiling MockUSDm.sol, extract the bytecode and ABI from the artifacts and update this file. The placeholders will be replaced with real values during Task 2.

- [ ] **Step 10: Create packages/contracts/src/index.ts**

```typescript
export { deployMockERC20 } from "./mock-erc20";
```

- [ ] **Step 11: Verify packages resolve**

```bash
cd /home/alien/sites/alu/capstone && pnpm install
# Should install all workspace deps
ls node_modules/@ekimina/types
ls node_modules/@ekimina/contracts
```

- [ ] **Step 12: Commit**

```bash
git add pnpm-workspace.yaml packages/ package.json pnpm-lock.yaml
git commit -m "feat: add shared packages (types + contracts) to monorepo"
```

---

### Task 2: Replace Solidity contracts with new design + MockUSDm

**Files:**
- Replace: `contract/contracts/Ikimina.sol`
- Create: `contract/contracts/MockUSDm.sol`
- Create: `contract/contracts/test/Ikimina.t.sol`
- Update: `contract/hardhat.config.ts`
- Update: `contract/ignition/modules/Ikimina.ts`

- [ ] **Step 1: Copy new Ikimina.sol**

Copy `app/new-design/Ikimina.sol` → `contract/contracts/Ikimina.sol` (495 lines, includes both Ikimina and IkiminaFactory).

- [ ] **Step 2: Create MockUSDm.sol**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "./Ikimina.sol";

contract MockUSDm is IERC20 {
    string public name = "Mock USDm";
    string public symbol = "USDM";
    uint8 public decimals = 18;

    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        require(balanceOf[msg.sender] >= amount, "insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        require(balanceOf[from] >= amount, "insufficient balance");
        require(allowance[from][msg.sender] >= amount, "insufficient allowance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        emit Transfer(from, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
}
```

- [ ] **Step 3: Create Ikimina.t.sol — test setup + factory test**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../Ikimina.sol";
import "../MockUSDm.sol";

contract IkiminaTest is Test {
    MockUSDm public token;
    IkiminaFactory public factory;
    Ikimina public group;
    Ikimina.Config public config;

    address public creator = address(0x1);
    address public member1 = address(0x2);
    address public member2 = address(0x3);
    address public member3 = address(0x4);
    bytes32 public inviteHash = keccak256("ABCDE");

    uint256 public constant CONTRIBUTION = 10 ether;
    uint256 public constant CYCLE_LENGTH = 1 days;
    uint256 public constant PAYOUT = 5 ether;
    uint16 public constant PENALTY_BPS = 500; // 5%
    uint16 public constant THRESHOLD_BPS = 5000; // 50%

    function setUp() public {
        token = new MockUSDm();
        factory = new IkiminaFactory(IERC20(address(token)));

        config = Ikimina.Config({
            contributionAmount: CONTRIBUTION,
            cycleLength: CYCLE_LENGTH,
            payoutAmount: PAYOUT,
            payoutPolicy: Ikimina.PayoutPolicy.Rotating,
            penaltyRateBps: PENALTY_BPS,
            approvalThresholdBps: THRESHOLD_BPS,
            loansEnabled: true,
            discretionaryEnabled: true,
            allMembersCommittee: true
        });

        vm.prank(creator);
        address groupAddr = factory.createGroup(config, inviteHash);
        group = Ikimina(groupAddr);

        // Mint tokens for testing
        token.mint(creator, 1000 ether);
        token.mint(member1, 1000 ether);
        token.mint(member2, 1000 ether);
    }

    function testFactoryCreatesGroup() public {
        assertEq(factory.allGroupsLength(), 1);
        assertEq(address(factory.token()), address(token));
    }

    function testGroupInitializedWithCreator() public {
        assertTrue(group.isMember(creator));
        assertTrue(group.isActive(creator));
        assertTrue(group.isCommittee(creator));
        assertEq(group.currentCycle(), 1);
    }

    function testJoinWithValidCode() public {
        vm.prank(member1);
        group.join("ABCDE");
        assertTrue(group.isMember(member1));
        assertTrue(group.isActive(member1));
    }

    function testJoinWithInvalidCode() public {
        vm.prank(member1);
        vm.expectRevert("bad code");
        group.join("WRONG");
    }

    function testJoinDuplicateMember() public {
        vm.prank(member1);
        group.join("ABCDE");
        vm.prank(member1);
        vm.expectRevert("member");
        group.join("ABCDE");
    }

    function testContribute() public {
        vm.prank(member1);
        group.join("ABCDE");
        vm.prank(member2);
        group.join("ABCDE");

        token.approve(address(group), CONTRIBUTION);
        vm.prank(member1);
        group.contribute();
        assertTrue(group.hasPaid(1, member1));
    }

    function testContributeWithoutAllowance() public {
        vm.prank(member1);
        group.join("ABCDE");
        vm.prank(member1);
        vm.expectRevert("transfer failed - check allowance");
        group.contribute();
    }

    function testContributeTwice() public {
        vm.prank(member1);
        group.join("ABCDE");
        token.approve(address(group), CONTRIBUTION);
        vm.prank(member1);
        group.contribute();
        vm.prank(member1);
        vm.expectRevert("paid");
        group.contribute();
    }

    function testTriggerPayoutAfterCycleEnd() public {
        vm.prank(member1);
        group.join("ABCDE");
        vm.prank(member2);
        group.join("ABCDE");

        // Both contribute
        vm.startPrank(member1);
        token.approve(address(group), CONTRIBUTION);
        group.contribute();
        vm.stopPrank();
        vm.startPrank(member2);
        token.approve(address(group), CONTRIBUTION);
        group.contribute();
        vm.stopPrank();

        // Warp past cycle end
        vm.warp(block.timestamp + CYCLE_LENGTH + 1);

        // Creator triggers payout (permissionless)
        vm.prank(creator);
        group.triggerPayout();

        // Cycle should have advanced
        assertEq(group.currentCycle(), 2);

        // First member (creator) should have received payout
        // Creator is members[0] (join order), is active, and was next in rotation
        assertGt(token.balanceOf(creator), 1000 ether - CONTRIBUTION);
    }

    function testPenaltyAppliedToNonPayer() public {
        vm.prank(member1);
        group.join("ABCDE");

        // Only member1 contributes, member2 doesn't join yet
        vm.prank(member1);
        token.approve(address(group), CONTRIBUTION);
        vm.prank(member1);
        group.contribute();

        vm.warp(block.timestamp + CYCLE_LENGTH + 1);
        vm.prank(creator);
        group.triggerPayout();

        // member2 wasn't active so no penalty for them. member1 was active, paid → no penalty
        // creator also active and paid → no penalty
        assertEq(group.penaltyOwed(creator), 0);
    }

    function testProposalCreateAndApproveAutoExecute() public {
        vm.prank(member1);
        group.join("ABCDE");
        // Creator + member1 = 2 committee (allMembersCommittee), threshold = 50% = 1

        // Create loan proposal
        uint256 loanAmount = 5 ether;
        uint256 interestBps = 1000; // 10%
        uint256 dueCycle = 3;

        // Give group some reserve via contributions
        vm.startPrank(creator);
        token.approve(address(group), CONTRIBUTION);
        group.contribute();
        vm.stopPrank();

        vm.prank(member1);
        token.approve(address(group), CONTRIBUTION);
        vm.prank(member1);
        group.contribute();

        vm.prank(member1);
        uint256 pid = group.proposeLoan(member1, loanAmount, interestBps, dueCycle);

        // member1 approves (auto-executes since threshold = 1)
        vm.prank(member1);
        bool executed = group.approveProposal(pid);
        assertTrue(executed);

        // Loan should be disbursed
        (,,,,,,, Ikimina.LoanState state) = group.getLoan(1);
        assertEq(uint8(state), uint8(Ikimina.LoanState.Disbursed));
        assertEq(token.balanceOf(member1), 1000 ether - CONTRIBUTION + loanAmount);
    }

    function testProposalAutoReject() public {
        vm.prank(member1);
        group.join("ABCDE");
        // 2 committee, threshold = 1

        uint256 pid = group.proposeLoan(member1, 5 ether, 1000, 3);

        // member1 rejects
        vm.prank(member1);
        bool rejected = group.rejectProposal(pid);
        // 1 rejection, committeeSize = 2, threshold = 1. 2-1 >= 1, so not rejected yet.
        assertFalse(rejected);

        // creator also rejects → 2 rejections, 2-2 < 1 → auto-reject
        vm.prank(creator);
        rejected = group.rejectProposal(pid);
        assertTrue(rejected);

        // Proposal should be rejected
        (,,,,,,,, Ikimina.ProposalState state) = group.getProposal(pid);
        // _id, _kind, _proposer, _params, _approvals, _rejections, _state, _createdAt
        // Actually getProposal returns Proposal struct: id, kind, proposer, params, approvals, rejections, state, createdAt
        Ikimina.Proposal memory p = group.getProposal(pid);
        assertEq(uint8(p.state), uint8(Ikimina.ProposalState.Rejected));
    }

    function testLoanRepay() public {
        vm.prank(member1);
        group.join("ABCDE");

        // Contribute to build reserve
        vm.startPrank(creator);
        token.approve(address(group), CONTRIBUTION);
        group.contribute();
        vm.stopPrank();

        uint256 pid = group.proposeLoan(member1, 5 ether, 1000, 3);
        vm.prank(member1);
        group.approveProposal(pid);

        // Repay the loan
        Ikimina.Loan memory l = group.getLoan(1);
        uint256 toRepay = l.totalOwed;
        vm.prank(member1);
        token.approve(address(group), toRepay);
        vm.prank(member1);
        group.repayLoan(1);

        (,,,,,,, Ikimina.LoanState state) = group.getLoan(1);
        assertEq(uint8(state), uint8(Ikimina.LoanState.Repaid));
    }

    function testDissolveSharesOut() public {
        vm.prank(member1);
        group.join("ABCDE");

        // Both contribute
        vm.startPrank(creator);
        token.approve(address(group), CONTRIBUTION);
        group.contribute();
        vm.stopPrank();
        vm.startPrank(member1);
        token.approve(address(group), CONTRIBUTION);
        group.contribute();
        vm.stopPrank();

        uint256 pid = group.proposeDissolve();
        // Both approve
        vm.prank(creator);
        group.approveProposal(pid);
        vm.prank(member1);
        group.approveProposal(pid);

        // Should be dissolved
        assertTrue(group.dissolved());
    }
}
```

- [ ] **Step 4: Update hardhat.config.ts to add foundry and localhost**

```typescript
import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";
import "dotenv/config";

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    localhost: {
      type: "http",
      chainId: 31337,
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
    celoSepolia: {
      type: "http",
      chainId: 11142220,
      url: "https://forno.celo-sepolia.celo-testnet.org/",
      accounts: [process.env.CELO_SEPOLIA_PRIVATE_KEY!],
    },
  },
  foundry: {
    testPattern: "contracts/test/**/*.t.sol",
  },
});
```

- [ ] **Step 5: Update ignition module to deploy MockUSDm + Factory**

```typescript
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("EkiminaModule", (m) => {
  const mockUsdm = m.contract("MockUSDm", []);

  const factory = m.contract("IkiminaFactory", [mockUsdm], {
    after: [mockUsdm],
  });

  // Seed a test group if on localhost
  // (manual via deploy-local.ts instead)

  return { mockUsdm, factory };
});
```

- [ ] **Step 6: Create deploy-local.ts**

Create `contract/scripts/deploy-local.ts`:

```typescript
import hre from "hardhat";

async function main() {
  const [deployer] = await hre.viem.getWalletClients();
  console.log("Deploying from:", deployer.account.address);

  // Deploy MockUSDm
  const mockUsdm = await hre.viem.deployContract("MockUSDm", []);
  console.log("MockUSDm deployed to:", mockUsdm.address);

  // Deploy factory
  const factory = await hre.viem.deployContract("IkiminaFactory", [mockUsdm.address]);
  console.log("IkiminaFactory deployed to:", factory.address);

  console.log("Done.");
}

main().catch(console.error);
```

- [ ] **Step 7: Compile contracts**

```bash
cd /home/alien/sites/alu/capstone/contract
pnpm hardhat compile
# Expected: 5 Solidity files compiled (Ikimina.sol has 2 contracts, MockUSDm.sol, IkiminaFactory.sol)
```

- [ ] **Step 8: Run forge tests**

```bash
cd /home/alien/sites/alu/capstone/contract
pnpm hardhat test --test-type forge
# Expected: All tests pass
```

- [ ] **Step 9: Update packages/contracts with compiled ABI**

After compilation, copy the ABI + bytecode from artifacts into `packages/contracts/src/generated.ts`:

```typescript
import { getContract, createPublicClient, createWalletClient, http } from "viem";
import { foundry } from "viem/chains";

// Generated from compilation — extract from artifacts
export const ikiminaABI = [/* copy from artifacts/contracts/Ikimina.sol/Ikimina.json */] as const;
export const factoryABI = [/* copy from artifacts/contracts/Ikimina.sol/IkiminaFactory.json */] as const;
export const mockERC20ABI = [/* copy from artifacts/contracts/MockUSDm.sol/MockUSDm.json */] as const;

export const publicClient = createPublicClient({
  chain: foundry,
  transport: http("http://127.0.0.1:8545"),
});

export function getIkiminaContract(address: `0x${string}`) {
  return getContract({
    address,
    abi: ikiminaABI,
    client: publicClient,
  });
}
```

- [ ] **Step 10: Update packages/contracts/src/index.ts with real ABI**

```typescript
export { ikiminaABI, factoryABI, mockERC20ABI, publicClient, getIkiminaContract } from "./generated";
```

- [ ] **Step 11: Commit**

```bash
git add contract/contracts/ contract/ignition/ contract/hardhat.config.ts contract/scripts/ packages/contracts/
git commit -m "feat: replace contract with new Ikimina + factory, add MockUSDm and tests"
```

---

### Task 3: Rewrite backend with Hono OpenAPI + viem

**Files:**
- Replace: `backend/package.json`
- Create: `backend/src/index.ts`
- Create: `backend/src/lib/chain.ts`
- Create: `backend/src/lib/indexer.ts`
- Create: `backend/src/lib/store.ts`
- Create: `backend/src/lib/auth.ts`
- Create: `backend/src/routes/auth.ts`
- Create: `backend/src/routes/profile.ts`
- Create: `backend/src/routes/lookup.ts`
- Create: `backend/src/routes/indexer.ts`
- Create: `backend/src/routes/proposals.ts`
- Create: `backend/src/routes/payments.ts`
- Create: `backend/src/routes/relay.ts`

- [ ] **Step 1: Update backend/package.json**

```json
{
  "name": "backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "build": "tsc"
  },
  "dependencies": {
    "@ekimina/types": "workspace:*",
    "@ekimina/contracts": "workspace:*",
    "@hono/node-server": "^2.0.4",
    "@hono/zod-openapi": "^0.18.0",
    "@hono/zod-validator": "^0.4.0",
    "hono": "^4.12.23",
    "viem": "^2.52.0"
  },
  "devDependencies": {
    "@types/node": "^22.19.19",
    "tsx": "^4.22.4",
    "typescript": "~6.0.3"
  }
}
```

- [ ] **Step 2: Create backend/src/lib/store.ts — in-memory data stores**

```typescript
import type { User, GroupMeta, ProposalText, PaymentIntent } from "@ekimina/types";

export const users = new Map<string, User>();
export const groupMeta = new Map<`0x${string}`, GroupMeta>();
export const proposalTexts = new Map<string, ProposalText>();
export const paymentIntents = new Map<string, PaymentIntent>();
export const refreshTokens = new Map<string, string>(); // userId -> token

// JWT secret for dev
export const JWT_SECRET = "dev-secret-ekimina-2026";
```

- [ ] **Step 3: Create backend/src/lib/auth.ts — mock OTP + JWT**

```typescript
import { sign, verify } from "hono/jwt"; // uses Web Crypto
import { JWT_SECRET, users } from "./store";
import type { User } from "@ekimina/types";

const MOCK_OTP = "123456";
const otpStore = new Map<string, string>(); // phone -> otp

export async function sendOtp(phone: string): Promise<{ sent: boolean }> {
  otpStore.set(phone, MOCK_OTP);
  return { sent: true };
}

export async function verifyOtp(phone: string, code: string): Promise<{ status: "existing" | "created"; token: string; user: User } | null> {
  const stored = otpStore.get(phone);
  if (!stored || stored !== code) return null;

  const existing = Array.from(users.values()).find(u => u.phone === phone);
  if (existing) {
    const token = await sign({ sub: existing.id, phone, type: "app" }, JWT_SECRET);
    return { status: "existing", token, user: existing };
  }

  // Create new user with generated address
  const id = `user-${Date.now()}`;
  const address = `0x${crypto.randomUUID().replace(/-/g, "").slice(0, 40)}` as `0x${string}`;
  const user: User = { id, address, name: null, phone, custodial: true, notificationsEnabled: true };
  users.set(id, user);
  const token = await sign({ sub: id, phone, type: "app" }, JWT_SECRET);
  return { status: "created", token, user };
}

export async function verifyJwt(token: string): Promise<{ sub: string; phone: string } | null> {
  try {
    const payload = await verify(token, JWT_SECRET);
    return { sub: payload.sub as string, phone: payload.phone as string };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Create backend/src/lib/chain.ts — viem contract wrappers**

```typescript
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";
import { ikiminaABI, factoryABI, mockERC20ABI } from "@ekimina/contracts";

const HARDHAT_RPC = "http://127.0.0.1:8545";
const HARDHAT_CHAIN_ID = 31337;

export const publicClient = createPublicClient({
  chain: { ...foundry, id: HARDHAT_CHAIN_ID },
  transport: http(HARDHAT_RPC),
});

// Backend custodial key (hardhat account #0)
const backendAccount = privateKeyToAccount("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");

export const walletClient = createWalletClient({
  account: backendAccount,
  chain: { ...foundry, id: HARDHAT_CHAIN_ID },
  transport: http(HARDHAT_RPC),
});

export function getFactoryContract(address: `0x${string}`) {
  return {
    address,
    abi: factoryABI,
    publicClient,
    walletClient,
  };
}

export function getGroupContract(address: `0x${string}`) {
  return {
    address,
    abi: ikiminaABI,
    publicClient,
    walletClient,
  };
}
```

- [ ] **Step 5: Create backend/src/lib/indexer.ts — event cache**

```typescript
import { publicClient, walletClient } from "./chain";
import { factoryABI, ikiminaABI } from "@ekimina/contracts";
import { groupMeta } from "./store";
import type { Group, GroupCycle, GroupMember, Transaction, ChainProposal, GroupLoan, ReservePoint } from "@ekimina/types";

// --- Caches ---
const groupCache = new Map<`0x${string}`, Group>();
const cycleCache = new Map<`0x${string}`, GroupCycle>();
const memberCache = new Map<`0x${string}`, GroupMember[]>();
const txCache = new Map<`0x${string}`, Transaction[]>();
const proposalCache = new Map<`0x${string}`, ChainProposal[]>();
const loanCache = new Map<`0x${string}`, GroupLoan[]>();
const reserveCache = new Map<`0x${string}`, ReservePoint[]>();

let factoryAddress: `0x${string}` | null = null;
let isPolling = false;

export function setFactoryAddress(addr: `0x${string}`) {
  factoryAddress = addr;
}

export async function startIndexer() {
  if (isPolling || !factoryAddress) return;
  isPolling = true;
  poll();
}

async function poll() {
  if (!factoryAddress) return;
  console.log("[indexer] polling chain state...");

  // Read all groups from factory
  const allGroupsLength = await publicClient.readContract({
    address: factoryAddress,
    abi: factoryABI,
    functionName: "allGroupsLength",
  });

  for (let i = 0; i < Number(allGroupsLength); i++) {
    const groupAddr = await publicClient.readContract({
      address: factoryAddress,
      abi: factoryABI,
      functionName: "allGroups",
      args: [BigInt(i)],
    }) as `0x${string}`;

    await refreshGroup(groupAddr);
  }

  setTimeout(poll, 5000); // poll every 5s
}

async function refreshGroup(address: `0x${string}`) {
  // Read on-chain state
  const config = await publicClient.readContract({
    address,
    abi: ikiminaABI,
    functionName: "config",
  }) as any;

  groupCache.set(address, {
    contributionAmount: config.contributionAmount.toString(),
    cycleLength: Number(config.cycleLength),
    payoutAmount: config.payoutAmount.toString(),
    payoutPolicy: ["none", "rotating", "lump_sum_end"][config.payoutPolicy] as any,
    penaltyRateBps: Number(config.penaltyRateBps),
    approvalThresholdBps: Number(config.approvalThresholdBps),
    loansEnabled: config.loansEnabled,
    discretionaryEnabled: config.discretionaryEnabled,
    allMembersCommittee: config.allMembersCommittee,
  });

  const currentCycle = Number(await publicClient.readContract({
    address, abi: ikiminaABI, functionName: "currentCycle",
  }));
  const cycleStart = Number(await publicClient.readContract({
    address, abi: ikiminaABI, functionName: "cycleStart",
  }));
  const reserve = await publicClient.readContract({
    address, abi: ikiminaABI, functionName: "reserve",
  }) as bigint;
  const memberCount = Number(await publicClient.readContract({
    address, abi: ikiminaABI, functionName: "activeCount",
  }));
  const paid = Number(await publicClient.readContract({
    address, abi: ikiminaABI, functionName: "paidCount",
    args: [BigInt(currentCycle)],
  }));

  cycleCache.set(address, {
    currentCycle,
    rotationLength: memberCount,
    cycleStart: new Date(cycleStart * 1000).toISOString(),
    reserveBalance: reserve.toString(),
    paidCount: paid,
    memberCount,
  });
}

// --- Read APIs ---
export function getCachedGroup(address: `0x${string}`): Group | undefined {
  return groupCache.get(address);
}
export function getCachedCycle(address: `0x${string}`): GroupCycle | undefined {
  return cycleCache.get(address);
}
```

> Note: This is the skeleton. Event decoding (Transaction[], ChainProposal[], GroupLoan[]) requires parsing event logs from the contract. The initial implementation will do direct readContract calls for views and simple event polling. Full event parsing will be added in a follow-up.

- [ ] **Step 6: Create backend/src/routes/auth.ts**

```typescript
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validate";
import { sendOtp, verifyOtp } from "../lib/auth";

const auth = new Hono();

auth.post("/otp/send", zValidator("json", z.object({ phone: z.string() })), async (c) => {
  const { phone } = c.req.valid("json");
  const result = await sendOtp(phone);
  return c.json(result);
});

auth.post("/otp/verify", zValidator("json", z.object({ phone: z.string(), code: z.string() })), async (c) => {
  const { phone, code } = c.req.valid("json");
  const result = await verifyOtp(phone, code);
  if (!result) return c.json({ error: "invalid code" }, 401);
  return c.json(result);
});

auth.post("/pin", async (c) => {
  // Stub: accept any PIN
  return c.json({ ok: true });
});

auth.post("/pin/verify", async (c) => {
  return c.json({ ok: true });
});

export default auth;
```

- [ ] **Step 7: Create backend/src/routes/profile.ts**

```typescript
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validate";
import { users } from "../lib/store";

const profile = new Hono();

profile.get("/users/:address", async (c) => {
  const address = c.req.param("address") as `0x${string}`;
  const user = Array.from(users.values()).find(u => u.address === address);
  if (!user) return c.json({ error: "not found" }, 404);
  return c.json(user);
});

profile.patch("/users/me", zValidator("json", z.object({ name: z.string().optional(), notificationsEnabled: z.boolean().optional() })), async (c) => {
  const body = c.req.valid("json");
  const userId = c.req.header("x-user-id");
  if (!userId) return c.json({ error: "unauthorized" }, 401);
  const user = users.get(userId);
  if (!user) return c.json({ error: "not found" }, 404);
  if (body.name !== undefined) user.name = body.name;
  if (body.notificationsEnabled !== undefined) user.notificationsEnabled = body.notificationsEnabled;
  return c.json(user);
});

export default profile;
```

- [ ] **Step 8: Create backend/src/routes/lookup.ts**

```typescript
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validate";
import { groupMeta } from "../lib/store";
import type { Address } from "@ekimina/types";

const lookup = new Hono();

lookup.post("/lookup/names", zValidator("json", z.object({ addresses: z.array(z.string()) })), async (c) => {
  const { addresses } = c.req.valid("json");
  const result: Record<string, string> = {};
  for (const addr of addresses) {
    const user = Array.from(users.values()).find(u => u.address === addr);
    result[addr] = user?.name ?? addr.slice(0, 6);
  }
  return c.json(result);
});

lookup.get("/groups/by-invite/:code", async (c) => {
  const code = c.req.param("code");
  const meta = Array.from(groupMeta.values()).find(g => g.inviteCode === code);
  if (!meta) return c.json({ error: "not found" }, 404);
  return c.json(meta);
});

export default lookup;
```

- [ ] **Step 9: Create backend/src/routes/indexer.ts**

```typescript
import { Hono } from "hono";
import { publicClient, getGroupContract } from "../lib/chain";
import { ikiminaABI, factoryABI } from "@ekimina/contracts";
import { getCachedGroup, getCachedCycle } from "../lib/indexer";

const indexer = new Hono();

indexer.get("/users/:address/groups", async (c) => {
  const address = c.req.param("address") as `0x${string}`;
  const allGroups = Array.from(groupMeta.values());
  return c.json(allGroups);
});

indexer.get("/groups/:group", async (c) => {
  const group = c.req.param("group") as `0x${string}`;
  const cached = getCachedGroup(group);
  if (cached) return c.json(cached);

  // Fallback: read from chain
  const config = await publicClient.readContract({ address: group, abi: ikiminaABI, functionName: "config" }) as any;
  return c.json({
    contributionAmount: config.contributionAmount.toString(),
    cycleLength: Number(config.cycleLength),
    payoutAmount: config.payoutAmount.toString(),
    payoutPolicy: ["none", "rotating", "lump_sum_end"][config.payoutPolicy],
    penaltyRateBps: Number(config.penaltyRateBps),
    approvalThresholdBps: Number(config.approvalThresholdBps),
    loansEnabled: config.loansEnabled,
    discretionaryEnabled: config.discretionaryEnabled,
    allMembersCommittee: config.allMembersCommittee,
  });
});

indexer.get("/groups/:group/cycle", async (c) => {
  const group = c.req.param("group") as `0x${string}`;
  const cached = getCachedCycle(group);
  if (cached) return c.json(cached);

  const currentCycle = await publicClient.readContract({ address: group, abi: ikiminaABI, functionName: "currentCycle" }) as bigint;
  const cycleStart = await publicClient.readContract({ address: group, abi: ikiminaABI, functionName: "cycleStart" }) as bigint;
  return c.json({
    currentCycle: Number(currentCycle),
    rotationLength: 0,
    cycleStart: new Date(Number(cycleStart) * 1000).toISOString(),
    reserveBalance: "0",
    paidCount: 0,
    memberCount: 0,
  });
});

export default indexer;
```

- [ ] **Step 10: Create backend/src/routes/relay.ts**

```typescript
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validate";
import { walletClient, publicClient, getGroupContract } from "../lib/chain";
import { ikiminaABI } from "@ekimina/contracts";

const relay = new Hono();

relay.post("/relay/groups/:group/contribute", async (c) => {
  const group = c.req.param("group") as `0x${string}`;
  const hash = await walletClient.writeContract({
    address: group,
    abi: ikiminaABI,
    functionName: "contribute",
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return c.json({ txId: receipt.transactionHash });
});

relay.post("/relay/groups/:group/join", zValidator("json", z.object({ code: z.string() })), async (c) => {
  const group = c.req.param("group") as `0x${string}`;
  const { code } = c.req.valid("json");
  const hash = await walletClient.writeContract({
    address: group,
    abi: ikiminaABI,
    functionName: "join",
    args: [code],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return c.json({ txId: receipt.transactionHash });
});

relay.post("/relay/groups/:group/trigger-payout", async (c) => {
  const group = c.req.param("group") as `0x${string}`;
  const hash = await walletClient.writeContract({
    address: group,
    abi: ikiminaABI,
    functionName: "triggerPayout",
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return c.json({ txId: receipt.transactionHash });
});

export default relay;
```

- [ ] **Step 11: Create backend/src/index.ts — app entry**

```typescript
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profile";
import lookupRoutes from "./routes/lookup";
import indexerRoutes from "./routes/indexer";
import relayRoutes from "./routes/relay";
import { setFactoryAddress, startIndexer } from "./lib/indexer";
import { deployMockERC20 } from "@ekimina/contracts";
import { walletClient, publicClient } from "./lib/chain";

const app = new Hono();

app.use("*", logger());

app.get("/", (c) => c.json({ service: "e-Kimina API", version: "0.2.0", status: "running" }));

app.route("/", authRoutes);
app.route("/", profileRoutes);
app.route("/", lookupRoutes);
app.route("/", indexerRoutes);
app.route("/", relayRoutes);

// Export type for hono/rpc client on the app side
export type AppType = typeof app;

async function bootstrap() {
  const factoryAddress = process.env.FACTORY_ADDRESS;
  if (!factoryAddress) {
    console.error("[bootstrap] FACTORY_ADDRESS env var required. Run deploy-local.ts first.");
    console.error("  cd contract && pnpm hardhat run scripts/deploy-local.ts --network localhost");
    process.exit(1);
  }

  setFactoryAddress(factoryAddress as `0x${string}`);
  await startIndexer();
}

serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log("e-Kimina backend running on http://localhost:3000");
  bootstrap();
});
```

- [ ] **Step 12: Install deps and verify backend compiles**

```bash
cd /home/alien/sites/alu/capstone && pnpm install
cd backend && npx tsc --noEmit
# Expected: TypeScript compiles without errors
```

- [ ] **Step 13: Commit**

```bash
git add backend/
git commit -m "feat: rewrite backend with Hono OpenAPI + viem chain integration"
```

---

### Task 4: Update app API layer to use DataClient facade

**Files:**
- Create: `app/src/api/backend-client.ts`
- Create: `app/src/api/chain-client.ts`
- Create: `app/src/api/custody.ts`
- Create: `app/src/api/data-client.ts`
- Replace: `app/src/api/index.ts`
- Delete: `app/src/api/types.ts`
- Delete: `app/src/api/auth.ts`
- Delete: `app/src/api/groups.ts`
- Delete: `app/src/api/mock/`
- Update: `app/package.json`

- [ ] **Step 1: Update app/package.json — add dependencies**

```json
{
  "dependencies": {
    "@ekimina/types": "workspace:*",
    "@ekimina/contracts": "workspace:*",
    "viem": "^2.52.0",
    "hono": "^4.12.23"
  }
}
```

- [ ] **Step 2: Create app/src/api/backend-client.ts — hono/rpc typed client**

```typescript
import { hc } from "hono/client";
import type { AppType } from "../../../backend/src";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

export const backendClient = hc<AppType>(BACKEND_URL);
```

> Note: `AppType` needs to be exported from the backend. We'll update the backend to export the type in Task 3's `backend/src/index.ts`:
> `export type AppType = typeof app;`

- [ ] **Step 3: Create app/src/api/chain-client.ts — viem WalletClient**

```typescript
import { createWalletClient, http, createPublicClient } from "viem";
import { foundry } from "viem/chains";

const HARDHAT_RPC = process.env.EXPO_PUBLIC_HARDHAT_RPC ?? "http://localhost:8545";

export const publicClient = createPublicClient({
  chain: foundry,
  transport: http(HARDHAT_RPC),
});

export function createUserWalletClient(privateKey: `0x${string}`) {
  return createWalletClient({
    account: privateKey as any,
    chain: foundry,
    transport: http(HARDHAT_RPC),
  });
}
```

- [ ] **Step 4: Create app/src/api/custody.ts — key management**

```typescript
import * as SecureStore from "expo-secure-store";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { Address } from "@ekimina/types";

const KEY_STORE = "ekimina_private_key";
const ADDRESS_STORE = "ekimina_address";

export const custody = {
  async importAccount(secret: string): Promise<{ address: Address }> {
    const account = privateKeyToAccount(secret as `0x${string}`);
    await SecureStore.setItemAsync(KEY_STORE, secret);
    await SecureStore.setItemAsync(ADDRESS_STORE, account.address);
    return { address: account.address as Address };
  },

  async createAccount(): Promise<{ address: Address }> {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    await SecureStore.setItemAsync(KEY_STORE, privateKey);
    await SecureStore.setItemAsync(ADDRESS_STORE, account.address);
    return { address: account.address as Address };
  },

  async unlock(): Promise<{ address: Address } | null> {
    const privateKey = await SecureStore.getItemAsync(KEY_STORE);
    if (!privateKey) return null;
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    return { address: account.address as Address };
  },

  async currentAddress(): Promise<Address | null> {
    const address = await SecureStore.getItemAsync(ADDRESS_STORE);
    return address as Address | null;
  },
};
```

- [ ] **Step 5: Create app/src/api/data-client.ts — DataClient facade**

```typescript
import type { DataClient, Address, GroupReads, GroupActions, AuthApi, CustodyApi, ProfileApi, LookupApi, PaymentApi } from "@ekimina/types";
import { backendClient } from "./backend-client";
import { custody } from "./custody";
import { publicClient } from "./chain-client";
import { ikiminaABI } from "@ekimina/contracts";

// AuthApi — calls backend
const auth: AuthApi = {
  async sendOtp(phone) { const res = await backendClient.auth["otp"].send.$post({ json: { phone } }); return res.json(); },
  async verifyOtp(phone, code) { const res = await backendClient.auth["otp"].verify.$post({ json: { phone, code } }); return res.json() as any; },
  async setPin() { const res = await backendClient.auth.pin.$post({ json: { pin: "1234" } }); return res.json(); },
  async verifyPin() { const res = await backendClient.auth["pin"].verify.$post({ json: { pin: "1234" } }); return res.json(); },
};

// ProfileApi — calls backend
const profile: ProfileApi = {
  async getUser(address) { const res = await backendClient.users[":address"].$get({ param: { address } }); return res.json() as any; },
  async updateName(name) { const res = await backendClient["users"].me.$patch({ json: { name } }); return res.json() as any; },
  async updateNotifications(enabled) { const res = await backendClient["users"].me.$patch({ json: { notificationsEnabled: enabled } }); return res.json() as any; },
};

// GroupReads — calls backend indexer
const groupReads: GroupReads = {
  async myGroups(address) {
    const res = await backendClient.users[":address"].groups.$get({ param: { address } });
    return res.json() as any;
  },
  async getGroup(group) { const res = await backendClient.groups[":group"].$get({ param: { group } }); return res.json() as any; },
  async getCycleState(group) { const res = await backendClient.groups[":group"].cycle.$get({ param: { group } }); return res.json() as any; },
  async getMembers(group) {
    // TODO: implement when backend has members endpoint
    return [];
  },
  async listTransactions(group, filters?) {
    // TODO: implement when backend has transactions endpoint
    return [];
  },
  async getTransaction(group, txId) { throw new Error("not implemented"); },
  async listProposals(group, state?) { return []; },
  async getProposal(group, id) { throw new Error("not implemented"); },
  async listLoans(group, borrower?) { return []; },
  async getLoan(group, id) { throw new Error("not implemented"); },
  async getReserveHistory(group) { return []; },
};

// GroupActions — non-custodial via viem, custodial via relay
const groupActions: GroupActions = {
  async createGroup(group, name) { throw new Error("not implemented"); },
  async join(code) { throw new Error("not implemented"); },
  async contribute(group) {
    const addr = await custody.currentAddress();
    if (addr) {
      const hash = await publicClient.writeContract({
        address: group as `0x${string}`,
        abi: ikiminaABI,
        functionName: "contribute",
        account: addr as any,
      });
      return { txId: hash };
    }
    const res = await backendClient.relay.groups[":group"].contribute.$post({ param: { group } });
    return res.json();
  },
  async triggerPayout(group) {
    const res = await backendClient.relay.groups[":group"]["trigger-payout"].$post({ param: { group } });
    return res.json();
  },
  async startRotation(group, order) { throw new Error("not implemented"); },
  async repayLoan(group, loanId) { throw new Error("not implemented"); },
  async shareOut(group) { throw new Error("not implemented"); },
  async createProposal(group, draft) { throw new Error("not implemented"); },
  async approveProposal(group, id) { throw new Error("not implemented"); },
  async rejectProposal(group, id) { throw new Error("not implemented"); },
};

export const dataClient: DataClient = {
  auth,
  custody,
  profile,
  lookup: {
    async resolveNames(addresses) {
      const res = await backendClient.lookup.names.$post({ json: { addresses } });
      return res.json() as any;
    },
    async groupByInviteCode(code) {
      const res = await backendClient.groups["by-invite"][":code"].$get({ param: { code } });
      return res.json() as any;
    },
  },
  payments: {
    async createIntent(input) { throw new Error("not implemented"); },
    async getIntent(id) { throw new Error("not implemented"); },
    async retryIntent(id) { throw new Error("not implemented"); },
  },
  groups: groupReads,
  actions: groupActions,
};
```

- [ ] **Step 6: Replace app/src/api/index.ts**

```typescript
export { dataClient } from "./data-client";
export { backendClient } from "./backend-client";
export { custody } from "./custody";
```

- [ ] **Step 7: Remove old mock files**

```bash
rm -rf app/src/api/types.ts app/src/api/auth.ts app/src/api/groups.ts app/src/api/mock/
```

- [ ] **Step 8: Install deps and verify**

```bash
cd /home/alien/sites/alu/capstone && pnpm install
cd app && npx tsc --noEmit
# Expected: TypeScript compiles without errors
```

- [ ] **Step 9: Commit**

```bash
git add app/src/api/ app/package.json
git rm app/src/api/types.ts app/src/api/auth.ts app/src/api/groups.ts
git rm -r app/src/api/mock/
git commit -m "feat: replace mock API layer with DataClient (viem + hono/rpc)"
```

---

### Task 5: Update navigation store + auth flow

**Files:**
- Modify: `app/src/stores/auth.ts`
- Modify: `app/src/lib/auth-storage.ts`

- [ ] **Step 1: Update auth store to use backend OTP + custody**

Update `app/src/stores/auth.ts`:

```typescript
// Before: uses mock auth. After: calls dataClient.auth.*
// This is a minimal sketch — actual migration will need detailed per-screen changes

import { atom } from "nanostores";
import { dataClient } from "../api";
import type { Address } from "@ekimina/types";

export interface AuthUser {
  phone: string;
  token: string;
  address: Address;
  name: string | null;
  custodial: boolean;
}

export const $auth = atom<AuthUser | null>(null);
export const $authLoading = atom(true);

export async function loginWithOtp(phone: string, code: string) {
  const result = await dataClient.auth.verifyOtp(phone, code);
  if ("token" in result) {
    const user = result.user;
    $auth.set({
      phone: user.phone ?? phone,
      token: result.token,
      address: user.address,
      name: user.name,
      custodial: user.custodial,
    });
    // Create a wallet if none exists
    const addr = await dataClient.custody.currentAddress();
    if (!addr && !user.custodial) {
      await dataClient.custody.createAccount();
    }
  }
  return result;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/stores/auth.ts app/src/lib/auth-storage.ts
git commit -m "feat: update auth flow to use backend OTP + custody"
```

---

### Task 6: Screen migration — onboarding screens

**Files:**
- Modify: `app/src/app/(onboarding)/phone.tsx`
- Modify: `app/src/app/(onboarding)/verify.tsx`
- Modify: `app/src/app/(onboarding)/join-or-create.tsx`
- Modify: `app/src/app/(onboarding)/invite-code.tsx`
- Modify: `app/src/app/(onboarding)/search-groups.tsx`
- Modify: `app/src/app/(onboarding)/pending.tsx`
- Modify: `app/src/app/(onboarding)/signup/name.tsx`
- Modify: `app/src/app/(onboarding)/create-group/step-1.tsx` through `step-6.tsx`

General migration pattern for each screen:
1. Replace `import { api } from "../../api"` with `import { dataClient } from "../../api"`
2. Replace mock types with `@ekimina/types` equivalents
3. Use `dataClient.lookup.resolveNames()` for member display names
4. Use `toDisplay()` helper for BaseUnit amounts

- [ ] **Step 1: Update phone.tsx — use dataClient.auth.sendOtp**

Replace `api.auth.sendOtp(phone)` with `dataClient.auth.sendOtp(phone)`.

- [ ] **Step 2: Update verify.tsx — use dataClient.auth.verifyOtp**

Replace `api.auth.verifyOtp(phone, code)` with `dataClient.auth.verifyOtp(phone, code)`.

- [ ] **Step 3: Update join-or-create.tsx — use dataClient.lookup.groupByInviteCode**

Replace invite code lookup with backend call.

- [ ] **Step 4: Update invite-code.tsx**

Replace `api.groups.joinByInviteCode()` with `dataClient.join(code)`.

- [ ] **Step 5: Update search-groups.tsx**

Replace mock search with `dataClient.groups.myGroups(address)` (indexer).

- [ ] **Step 6: Update create-group wizard steps**

The create group wizard currently stores `templateId` and builds settings via templates. The new contract takes a `Config` struct. Update the wizard to build a `Group` config and call `dataClient.actions.createGroup(group, name)`.

- [ ] **Step 7: Commit**

```bash
git add app/src/app/(onboarding)/
git commit -m "feat: migrate onboarding screens to dataClient"
```

---

### Task 7: Screen migration — tab screens

**Files:**
- Modify: `app/src/app/(tabs)/_layout.tsx`
- Modify: `app/src/app/(tabs)/home/index.tsx`
- Modify: `app/src/app/(tabs)/home/reserve.tsx`
- Modify: `app/src/app/(tabs)/members/index.tsx`
- Modify: `app/src/app/(tabs)/members/[userId].tsx`
- Modify: `app/src/app/(tabs)/activity/index.tsx`
- Modify: `app/src/app/(tabs)/activity/transactions.tsx`
- Modify: `app/src/app/(tabs)/activity/[transactionId].tsx`
- Modify: `app/src/app/(tabs)/activity/loan/[loanId].tsx`
- Modify: `app/src/app/(tabs)/profile/index.tsx`
- Modify: `app/src/app/(tabs)/profile/group-settings.tsx`

Migration pattern per screen:
1. Replace mock API imports with dataClient
2. Replace `api.groups.getGroupDashboard(gid)` with `dataClient.groups.getCycleState(groupAddr)`
3. Replace `api.groups.getGroupMembers(gid)` with `dataClient.groups.getMembers(groupAddr)`
4. Replace name display with `lookup.resolveNames()`
5. BaseUnit formatting for amounts
6. Member detail: `dataClient.groups.getMembers()` + lookup

Due to the volume, this task should be completed screen-by-screen. Each screen that was calling mock `api.groups.*` methods now calls the equivalent `dataClient.groups.*` or `dataClient.actions.*` methods. The screen structure stays the same; only the data source and type shapes change.

- [ ] **Step 1: Update home/index.tsx — dashboard**

Replace `api.groups.getGroupDashboard(activeGroupId)` with:
```
const cycle = await dataClient.groups.getCycleState(groupAddr);
const members = await dataClient.groups.getMembers(groupAddr);
const group = await dataClient.groups.getGroup(groupAddr);
```

- [ ] **Step 2: Update members screens**

Replace member list/detail calls with indexer reads + name resolution.

- [ ] **Step 3: Update activity screens**

Replace transaction/proposal/loan calls with indexer reads.

- [ ] **Step 4: Update profile screens**

Replace profile/settings calls with profile API + chain reads.

- [ ] **Step 5: Commit**

```bash
git add app/src/app/(tabs)/
git commit -m "feat: migrate tab screens to dataClient"
```

---

### Task 8: End-to-end verification

- [ ] **Step 1: Start hardhat node**

```bash
cd /home/alien/sites/alu/capstone/contract
npx hardhat node
# Expected: localhost:8545 running, accounts displayed
```

- [ ] **Step 2: Deploy contracts**

```bash
cd /home/alien/sites/alu/capstone/contract
pnpm hardhat run scripts/deploy-local.ts --network localhost
# Expected: MockUSDm + IkiminaFactory deployed, addresses printed
```

- [ ] **Step 3: Start backend**

```bash
cd /home/alien/sites/alu/capstone/backend
FACTORY_ADDRESS=<deployed-factory-address> pnpm dev
# Expected: backend running on :3000, indexer polling
```

- [ ] **Step 4: Start app**

```bash
cd /home/alien/sites/alu/capstone/app
pnpm expo start --web
# Expected: app loads, connects to backend
```

- [ ] **Step 5: Run full flow test**

1. OTP login → creates user + JWT
2. Create group → deploys Ikimina via factory
3. Join group → join transaction submitted
4. Contribute → token transfer to contract
5. Trigger payout → cycle advances
6. Create proposal → approve → auto-execute

- [ ] **Step 6: Commit final state**

```bash
git add -A
git commit -m "feat: complete on-chain migration — contract + backend + app"
```
