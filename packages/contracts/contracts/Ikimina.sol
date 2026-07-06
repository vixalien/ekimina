// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// ============================================================
// e-Kimina group contract, one deployed per group via IkiminaFactory.
//
// Design (matches the three-plane types):
//   - No PII on chain. Identity is an address. Names resolve off-chain.
//   - Money is uint256 base units of a single ERC20 (USDm). The contract
//     balance IS the reserve; it carries across rotations.
//   - Rotation order = join order over active members. No stored order,
//     no manual startRotation. Exits tombstone the slot (isActive = false)
//     so indices never shift.
//   - Governance is a generic multisig proposal. Five kinds share one
//     envelope. A proposal passes at ceil(committee * thresholdBps / 10000)
//     approvals and auto-rejects once approval is impossible.
//   - Auto-execute on threshold, with checks-effects-interactions.
//     executeProposal is a permissionless fallback when a precondition
//     (for example, reserve too small for a loan) blocked auto-execute.
//   - Share-out happens only via an executed dissolve proposal; a normal
//     rotation just rolls into a fresh cycle and the reserve carries.
// ============================================================

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract Ikimina {
    // ---- Enums (mirror primitives.ts) --------------------------
    enum PayoutPolicy { None, Rotating, LumpSumEnd }
    enum ProposalKind { Loan, Discretionary, Settings, MemberExit, Dissolve }
    enum ProposalState { Pending, Approved, Rejected, Executed }
    enum LoanState { Disbursed, Repaying, Repaid, Defaulted }

    // ---- Config (mirrors chain.ts Group) -----------------------
    struct Config {
        uint256 contributionAmount;
        uint256 cycleLength; // seconds
        uint256 payoutAmount; // may be 0
        PayoutPolicy payoutPolicy;
        uint16 penaltyRateBps;
        uint16 approvalThresholdBps;
        bool loansEnabled;
        bool discretionaryEnabled;
        bool allMembersCommittee;
    }

    struct Proposal {
        uint256 id;
        ProposalKind kind;
        address proposer;
        bytes params; // abi-encoded per kind, decoded at execute
        uint32 approvals;
        uint32 rejections;
        ProposalState state;
        uint64 createdAt;
    }

    struct Loan {
        uint256 id;
        address borrower;
        uint256 principal;
        uint256 interestBps;
        uint256 totalOwed;
        uint256 amountPaid;
        uint256 dueCycle;
        LoanState state;
    }

    // ---- Immutable / config ------------------------------------
    IERC20 public immutable token;
    address public immutable factory;
    Config public config;
    bytes32 public inviteCodeHash;

    // ---- Membership --------------------------------------------
    address[] public members; // append-only, includes tombstoned slots
    mapping(address => bool) public isMember;
    mapping(address => bool) public isActive;
    mapping(address => bool) public isCommitteeExplicit; // used only when !allMembersCommittee
    mapping(address => uint256) public joinedCycle;
    uint256 public explicitCommitteeCount;

    // ---- Cycle -------------------------------------------------
    uint256 public currentCycle; // monotonic, starts at 1
    uint256 public cycleStart;
    uint256 public nextPayoutIndex; // cursor into members[] for rotation
    bool public dissolved;

    // ---- Contributions / penalties -----------------------------
    mapping(uint256 => mapping(address => bool)) public hasPaid; // cycle => member => paid
    mapping(address => uint256) public penaltyOwed; // base units, deducted at share-out

    // ---- Proposals / loans -------------------------------------
    mapping(uint256 => Proposal) internal proposals;
    mapping(uint256 => mapping(address => uint8)) public voted; // 0 none, 1 approve, 2 reject
    uint256 public proposalCount;
    mapping(uint256 => Loan) internal loans;
    uint256 public loanCount;

    // ---- Reentrancy guard --------------------------------------
    uint256 private _lock = 1;
    modifier nonReentrant() {
        require(_lock == 1, "reentrant");
        _lock = 2;
        _;
        _lock = 1;
    }

    // ---- Events (the transaction + governance log) -------------
    event GroupInitialized(address indexed creator, uint256 timestamp);
    event MemberJoined(address indexed member, uint256 cycle);
    event MemberExited(address indexed member, uint256 settlement, uint256 proposalId);
    event ContributionMade(address indexed member, uint256 cycle, uint256 amount);
    event PayoutReleased(address indexed recipient, uint256 cycle, uint256 amount);
    event PenaltyApplied(address indexed member, uint256 cycle, uint256 amount);
    event ShareOut(address indexed recipient, uint256 amount);
    event LoanDisbursed(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 proposalId);
    event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 amount);
    event LoanDefaulted(uint256 indexed loanId, address indexed borrower);
    event DiscretionaryDisbursed(address indexed recipient, uint256 amount, uint256 proposalId);
    event ProposalCreated(uint256 indexed id, uint8 kind, address indexed proposer);
    event ProposalApproved(uint256 indexed id, address indexed approver);
    event ProposalRejected(uint256 indexed id, address indexed rejecter);
    event ProposalExecuted(uint256 indexed id);
    event ProposalClosed(uint256 indexed id, uint8 finalState);
    event InviteCodeRotated();

    // ---- Constructor -------------------------------------------
    constructor(address creator, IERC20 _token, Config memory _config, bytes32 _inviteCodeHash) {
        factory = msg.sender;
        token = _token;
        config = _config;
        inviteCodeHash = _inviteCodeHash;
        currentCycle = 1;
        cycleStart = block.timestamp;
        _addMember(creator, true); // founder seeds the explicit committee
        emit GroupInitialized(creator, block.timestamp);
    }

    // ---- Committee helpers -------------------------------------
    function _isCommittee(address who) internal view returns (bool) {
        if (!isActive[who]) return false;
        return config.allMembersCommittee ? true : isCommitteeExplicit[who];
    }

    function _committeeCount() internal view returns (uint256) {
        return config.allMembersCommittee ? _activeCount() : explicitCommitteeCount;
    }

    function _needed() internal view returns (uint256) {
        uint256 need = (_committeeCount() * config.approvalThresholdBps + 9999) / 10000;
        return need == 0 ? 1 : need;
    }

    // ---- Membership --------------------------------------------
    function join(string calldata code) external {
        require(!dissolved, "dissolved");
        require(keccak256(bytes(code)) == inviteCodeHash, "bad code");
        require(!isMember[msg.sender], "member");
        _addMember(msg.sender, false);
    }

    function _addMember(address who, bool committee) internal {
        isMember[who] = true;
        isActive[who] = true;
        joinedCycle[who] = currentCycle;
        members.push(who);
        if (committee) {
            isCommitteeExplicit[who] = true;
            explicitCommitteeCount++;
        }
        emit MemberJoined(who, currentCycle);
    }

    // ---- Contributions -----------------------------------------
    function contribute() external nonReentrant {
        require(!dissolved, "dissolved");
        require(isActive[msg.sender], "not active");
        require(!hasPaid[currentCycle][msg.sender], "paid");
        require(
            token.transferFrom(msg.sender, address(this), config.contributionAmount),
            "transfer failed - check allowance"
        );
        hasPaid[currentCycle][msg.sender] = true;
        emit ContributionMade(msg.sender, currentCycle, config.contributionAmount);
    }

    // ---- Payout / round advance --------------------------------
    // Permissionless, time-guarded. Applies penalties for non-payers, pays
    // the rotating turn (if any), then rolls into a fresh cycle. A backend
    // cron can call this. Reserve carries across the rotation wrap.
    function triggerPayout() external nonReentrant {
        require(!dissolved, "dissolved");
        require(block.timestamp >= cycleStart + config.cycleLength, "too early");

        uint256 n = members.length;

        // penalties for active members who did not pay this round
        uint256 pen = (config.contributionAmount * config.penaltyRateBps) / 10000;
        if (pen > 0) {
            for (uint256 i = 0; i < n; i++) {
                address m = members[i];
                if (isActive[m] && !hasPaid[currentCycle][m]) {
                    penaltyOwed[m] += pen;
                    emit PenaltyApplied(m, currentCycle, pen);
                }
            }
        }

        // scheduled rotating payout
        if (config.payoutPolicy == PayoutPolicy.Rotating && config.payoutAmount > 0) {
            address recipient = _nextActiveRecipient(n);
            if (recipient != address(0) && token.balanceOf(address(this)) >= config.payoutAmount) {
                require(token.transfer(recipient, config.payoutAmount), "payout failed");
                emit PayoutReleased(recipient, currentCycle, config.payoutAmount);
            }
        }

        currentCycle++;
        cycleStart = block.timestamp;
    }

    function _nextActiveRecipient(uint256 n) internal returns (address) {
        for (uint256 scanned = 0; scanned < n; scanned++) {
            if (nextPayoutIndex >= n) nextPayoutIndex = 0; // rotation wrapped
            address candidate = members[nextPayoutIndex];
            nextPayoutIndex++;
            if (isActive[candidate]) return candidate;
        }
        return address(0);
    }

    // ---- Proposals: typed creators -----------------------------
    function proposeLoan(
        address borrower,
        uint256 amount,
        uint256 interestBps,
        uint256 dueCycle
    ) external returns (uint256) {
        require(config.loansEnabled, "loans off");
        require(isActive[borrower], "borrower inactive");
        return _createProposal(ProposalKind.Loan, abi.encode(borrower, amount, interestBps, dueCycle));
    }

    function proposeDiscretionary(address recipient, uint256 amount) external returns (uint256) {
        require(config.discretionaryEnabled, "discretionary off");
        return _createProposal(ProposalKind.Discretionary, abi.encode(recipient, amount));
    }

    function proposeSettings(Config calldata newConfig) external returns (uint256) {
        return _createProposal(ProposalKind.Settings, abi.encode(newConfig));
    }

    function proposeMemberExit(address member, uint256 settlement) external returns (uint256) {
        require(isMember[member], "not member");
        return _createProposal(ProposalKind.MemberExit, abi.encode(member, settlement));
    }

    function proposeDissolve() external returns (uint256) {
        return _createProposal(ProposalKind.Dissolve, "");
    }

    function _createProposal(ProposalKind kind, bytes memory params) internal returns (uint256) {
        require(!dissolved, "dissolved");
        require(isActive[msg.sender], "not active");
        uint256 id = ++proposalCount;
        Proposal storage p = proposals[id];
        p.id = id;
        p.kind = kind;
        p.proposer = msg.sender;
        p.params = params;
        p.state = ProposalState.Pending;
        p.createdAt = uint64(block.timestamp);
        emit ProposalCreated(id, uint8(kind), msg.sender);
        return id;
    }

    // ---- Proposals: voting -------------------------------------
    function approveProposal(uint256 id) external nonReentrant returns (bool executed) {
        Proposal storage p = proposals[id];
        require(p.state == ProposalState.Pending, "not open");
        require(_isCommittee(msg.sender), "not committee");
        require(voted[id][msg.sender] == 0, "voted");
        voted[id][msg.sender] = 1;
        p.approvals++;
        emit ProposalApproved(id, msg.sender);

        if (p.approvals >= _needed()) {
            executed = _execute(id);
            if (!executed) p.state = ProposalState.Approved; // await executeProposal fallback
        }
    }

    function rejectProposal(uint256 id) external returns (bool rejected) {
        Proposal storage p = proposals[id];
        require(p.state == ProposalState.Pending, "not open");
        require(_isCommittee(msg.sender), "not committee");
        require(voted[id][msg.sender] == 0, "voted");
        voted[id][msg.sender] = 2;
        p.rejections++;
        emit ProposalRejected(id, msg.sender);

        // auto-reject once reaching threshold is impossible
        if (_committeeCount() - p.rejections < _needed()) {
            p.state = ProposalState.Rejected;
            emit ProposalClosed(id, uint8(ProposalState.Rejected));
            rejected = true;
        }
    }

    // Permissionless fallback: retry a threshold-met proposal whose auto-execute
    // was blocked by a precondition (for example reserve too small at the time).
    function executeProposal(uint256 id) external nonReentrant {
        require(proposals[id].state == ProposalState.Approved, "not approved");
        require(_execute(id), "not executable");
    }

    // ---- Execution (checks-effects-interactions) ---------------
    // Returns false without mutating state when a precondition blocks it,
    // so auto-execute can degrade to the Approved state and be retried.
    function _execute(uint256 id) internal returns (bool) {
        Proposal storage p = proposals[id];

        if (p.kind == ProposalKind.Loan) {
            (address borrower, uint256 amount, uint256 interestBps, uint256 dueCycle) =
                abi.decode(p.params, (address, uint256, uint256, uint256));
            if (token.balanceOf(address(this)) < amount) return false;
            p.state = ProposalState.Executed;
            uint256 lid = ++loanCount;
            uint256 owed = amount + (amount * interestBps) / 10000;
            loans[lid] = Loan(lid, borrower, amount, interestBps, owed, 0, dueCycle, LoanState.Disbursed);
            require(token.transfer(borrower, amount), "disburse failed");
            emit LoanDisbursed(lid, borrower, amount, id);
            emit ProposalExecuted(id);
            return true;
        }

        if (p.kind == ProposalKind.Discretionary) {
            (address recipient, uint256 amount) = abi.decode(p.params, (address, uint256));
            if (token.balanceOf(address(this)) < amount) return false;
            p.state = ProposalState.Executed;
            require(token.transfer(recipient, amount), "disc failed");
            emit DiscretionaryDisbursed(recipient, amount, id);
            emit ProposalExecuted(id);
            return true;
        }

        if (p.kind == ProposalKind.Settings) {
            Config memory c = abi.decode(p.params, (Config));
            p.state = ProposalState.Executed;
            config = c;
            emit ProposalExecuted(id);
            return true;
        }

        if (p.kind == ProposalKind.MemberExit) {
            (address member, uint256 settlement) = abi.decode(p.params, (address, uint256));
            if (token.balanceOf(address(this)) < settlement) return false;
            p.state = ProposalState.Executed;
            if (isActive[member]) {
                isActive[member] = false;
                if (isCommitteeExplicit[member]) {
                    isCommitteeExplicit[member] = false;
                    explicitCommitteeCount--;
                }
            }
            if (settlement > 0) require(token.transfer(member, settlement), "exit failed");
            emit MemberExited(member, settlement, id);
            emit ProposalExecuted(id);
            return true;
        }

        // Dissolve
        p.state = ProposalState.Executed;
        _shareOutAndClose();
        emit ProposalExecuted(id);
        return true;
    }

    function _shareOutAndClose() internal {
        uint256 active = _activeCount();
        uint256 bal = token.balanceOf(address(this));
        uint256 equalShare = active == 0 ? 0 : bal / active;
        uint256 n = members.length;
        for (uint256 i = 0; i < n; i++) {
            address m = members[i];
            if (!isActive[m]) continue;
            uint256 amt = equalShare > penaltyOwed[m] ? equalShare - penaltyOwed[m] : 0;
            if (amt > 0) {
                require(token.transfer(m, amt), "shareout failed");
                emit ShareOut(m, amt);
            }
        }
        dissolved = true;
        // withheld penalties plus integer-division dust remain in the contract
    }

    // ---- Loans -------------------------------------------------
    // Single full repayment for the pilot. Interest is already folded into
    // totalOwed and stays in the contract, growing the reserve.
    function repayLoan(uint256 loanId) external nonReentrant {
        Loan storage l = loans[loanId];
        require(l.state == LoanState.Disbursed || l.state == LoanState.Repaying, "not repayable");
        require(msg.sender == l.borrower, "not borrower");
        uint256 remaining = l.totalOwed - l.amountPaid;
        require(token.transferFrom(msg.sender, address(this), remaining), "repay failed");
        l.amountPaid = l.totalOwed;
        l.state = LoanState.Repaid;
        emit LoanRepaid(loanId, msg.sender, remaining);
    }

    // ---- Invite code rotation (not fund-moving, single committee call) ----
    function rotateInviteCode(bytes32 newHash) external {
        require(_isCommittee(msg.sender), "not committee");
        inviteCodeHash = newHash;
        emit InviteCodeRotated();
    }

    // ---- Views -------------------------------------------------
    function reserve() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function memberList() external view returns (address[] memory) {
        return members;
    }

    function activeCount() external view returns (uint256) {
        return _activeCount();
    }

    function _activeCount() internal view returns (uint256 c) {
        uint256 n = members.length;
        for (uint256 i = 0; i < n; i++) {
            if (isActive[members[i]]) c++;
        }
    }

    function paidCount(uint256 cycle) external view returns (uint256 c) {
        uint256 n = members.length;
        for (uint256 i = 0; i < n; i++) {
            if (isActive[members[i]] && hasPaid[cycle][members[i]]) c++;
        }
    }

    function isCommittee(address who) external view returns (bool) {
        return _isCommittee(who);
    }

    function committeeCount() external view returns (uint256) {
        return _committeeCount();
    }

    function neededApprovals() external view returns (uint256) {
        return _needed();
    }

    function getProposal(uint256 id) external view returns (Proposal memory) {
        return proposals[id];
    }

    function getLoan(uint256 id) external view returns (Loan memory) {
        return loans[id];
    }
}

// ============================================================
// Factory: one Ikimina per group. Holds the shared token (USDm) address so
// callers never pass it. The invite code is generated + hashed off-chain;
// only the hash reaches the chain (preimage revealed on first join).
// ============================================================
contract IkiminaFactory {
    IERC20 public immutable token;
    address[] public allGroups;

    event GroupDeployed(address indexed group, address indexed creator, bytes32 inviteCodeHash);

    constructor(IERC20 _token) {
        token = _token;
    }

    function createGroup(Ikimina.Config calldata config, bytes32 inviteCodeHash) external returns (address) {
        Ikimina g = new Ikimina(msg.sender, token, config, inviteCodeHash);
        allGroups.push(address(g));
        emit GroupDeployed(address(g), msg.sender, inviteCodeHash);
        return address(g);
    }

    function allGroupsLength() external view returns (uint256) {
        return allGroups.length;
    }
}
