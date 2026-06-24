// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);

    function transfer(address to, uint256 amount) external returns (bool);

    function balanceOf(address account) external view returns (uint256);
}

contract Ikimina {
    // ── State ──────────────────────────────────────────────────────────
    address public admin;
    IERC20 public cUSD;

    uint256 public contributionAmount;
    uint256 public roundDuration;
    uint256 public currentRound;
    uint256 public roundStartTime;

    address[] public members;
    mapping(address => bool) public isMember;
    mapping(address => uint256) public reputationScore;
    mapping(uint256 => address) public roundRecipient;
    mapping(uint256 => mapping(address => bool)) public hasPaid;

    // ── Events ─────────────────────────────────────────────────────────
    event MemberRegistered(address indexed member);
    event ContributionMade(
        address indexed member,
        uint256 round,
        uint256 amount
    );
    event PayoutReleased(
        address indexed recipient,
        uint256 round,
        uint256 amount
    );
    // Rename to PenaltyRecorded
    event DefaultRecorded(address indexed member, uint256 round);

    // ── Constructor ────────────────────────────────────────────────────
    constructor(
        address _cUSD,
        uint256 _contributionAmount,
        uint256 _roundDurationDays
    ) {
        admin = msg.sender;
        cUSD = IERC20(_cUSD);
        contributionAmount = _contributionAmount;
        roundDuration = _roundDurationDays * 1 days;
        currentRound = 1;
        roundStartTime = block.timestamp;
    }

    // ── Admin: register a member ───────────────────────────────────────
    function registerMember(address _member) external onlyAdmin {
        require(!isMember[_member], "Already registered");
        isMember[_member] = true;
        members.push(_member);
        reputationScore[_member] = 50;
        emit MemberRegistered(_member);
    }

    // ── Admin: set who receives the payout for a given round ───────────
    function setRoundRecipient(
        uint256 round,
        address recipient
    ) external onlyAdmin {
        require(isMember[recipient], "Recipient must be a member");
        roundRecipient[round] = recipient;
    }

    // ── Member: contribute USDm for the current round ──────────────────
    function contribute() external onlyMember {
        require(
            !hasPaid[currentRound][msg.sender],
            "Already contributed this round"
        );
        require(
            cUSD.transferFrom(msg.sender, address(this), contributionAmount),
            "Transfer failed - check allowance"
        );
        hasPaid[currentRound][msg.sender] = true;
        reputationScore[msg.sender] = _clamp(
            reputationScore[msg.sender] + 5,
            0,
            100
        );
        emit ContributionMade(msg.sender, currentRound, contributionAmount);
    }

    // ── Admin: release payout to the round recipient ───────────────────
    function releasePayout() external onlyAdmin {
        require(
            block.timestamp >= roundStartTime + roundDuration,
            "Round not over yet"
        );
        address recipient = roundRecipient[currentRound];
        require(recipient != address(0), "No recipient set for this round");

        uint256 pool = _countContributions() * contributionAmount;
        require(pool > 0, "Nothing to pay out");
        require(cUSD.transfer(recipient, pool), "Payout transfer failed");

        emit PayoutReleased(recipient, currentRound, pool);
        currentRound++;
        roundStartTime = block.timestamp;
    }

    // ── Admin: record a default against a member ───────────────────────
    function recordDefault(address _member) external onlyAdmin {
        require(isMember[_member], "Not a member");
        require(!hasPaid[currentRound][_member], "Member already paid");
        reputationScore[_member] = reputationScore[_member] > 20
            ? reputationScore[_member] - 20
            : 0;
        emit DefaultRecorded(_member, currentRound);
    }

    // ── View helpers ───────────────────────────────────────────────────
    function getMemberCount() external view returns (uint256) {
        return members.length;
    }

    function getBalance() external view returns (uint256) {
        return cUSD.balanceOf(address(this));
    }

    // ── Internal helpers ───────────────────────────────────────────────
    function _countContributions() internal view returns (uint256 count) {
        for (uint256 i = 0; i < members.length; i++) {
            if (hasPaid[currentRound][members[i]]) count++;
        }
    }

    function _clamp(
        uint256 val,
        uint256 min,
        uint256 max
    ) internal pure returns (uint256) {
        if (val < min) return min;
        if (val > max) return max;
        return val;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyMember() {
        require(isMember[msg.sender], "Not a member");
        _;
    }
}
