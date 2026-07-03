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
    uint16 public constant PENALTY_BPS = 500;
    uint16 public constant THRESHOLD_BPS = 5000;

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

    function testContribute() public {
        vm.prank(member1);
        group.join("ABCDE");

        vm.startPrank(member1);
        token.approve(address(group), CONTRIBUTION);
        group.contribute();
        vm.stopPrank();

        assertTrue(group.hasPaid(1, member1));
    }

    function testContributeWithoutAllowance() public {
        vm.prank(member1);
        group.join("ABCDE");

        vm.prank(member1);
        vm.expectRevert();
        group.contribute();
    }

    function testTriggerPayoutAfterCycleEnd() public {
        vm.prank(member1);
        group.join("ABCDE");

        vm.startPrank(member1);
        token.approve(address(group), CONTRIBUTION);
        group.contribute();
        vm.stopPrank();

        vm.warp(block.timestamp + CYCLE_LENGTH + 1);

        vm.prank(creator);
        group.triggerPayout();

        assertEq(group.currentCycle(), 2);
    }

    function testProposalCreateAndApproveLoan() public {
        vm.prank(member1);
        group.join("ABCDE");

        vm.startPrank(creator);
        token.approve(address(group), CONTRIBUTION);
        group.contribute();
        vm.stopPrank();

        vm.startPrank(member1);
        token.approve(address(group), CONTRIBUTION);
        group.contribute();
        vm.stopPrank();

        vm.prank(member1);
        uint256 pid = group.proposeLoan(member1, 5 ether, 1000, 3);

        vm.prank(member1);
        bool executed = group.approveProposal(pid);
        assertTrue(executed);

        Ikimina.Loan memory loan = group.getLoan(1);
        assertEq(uint8(loan.state), uint8(Ikimina.LoanState.Disbursed));
    }

    function testProposalAutoReject() public {
        vm.prank(member1);
        group.join("ABCDE");

        vm.prank(member1);
        uint256 pid = group.proposeLoan(member1, 5 ether, 1000, 3);

        vm.prank(member1);
        group.rejectProposal(pid);

        vm.prank(creator);
        bool rejected = group.rejectProposal(pid);
        assertTrue(rejected);

        Ikimina.Proposal memory p = group.getProposal(pid);
        assertEq(uint8(p.state), uint8(Ikimina.ProposalState.Rejected));
    }

    function testLoanRepay() public {
        vm.prank(member1);
        group.join("ABCDE");

        vm.startPrank(creator);
        token.approve(address(group), CONTRIBUTION);
        group.contribute();
        vm.stopPrank();

        vm.prank(member1);
        uint256 pid = group.proposeLoan(member1, 5 ether, 1000, 3);
        vm.prank(member1);
        group.approveProposal(pid);

        Ikimina.Loan memory l = group.getLoan(1);
        uint256 toRepay = l.totalOwed;

        vm.startPrank(member1);
        token.approve(address(group), toRepay);
        group.repayLoan(1);
        vm.stopPrank();

        Ikimina.Loan memory loan2 = group.getLoan(1);
        assertEq(uint8(loan2.state), uint8(Ikimina.LoanState.Repaid));
    }

    function testDissolveSharesOut() public {
        vm.prank(member1);
        group.join("ABCDE");

        vm.startPrank(creator);
        token.approve(address(group), CONTRIBUTION);
        group.contribute();
        vm.stopPrank();

        vm.startPrank(member1);
        token.approve(address(group), CONTRIBUTION);
        group.contribute();
        vm.stopPrank();

        vm.prank(member1);
        uint256 pid = group.proposeDissolve();

        vm.prank(member1);
        bool executed = group.approveProposal(pid);
        assertTrue(executed);

        assertTrue(group.dissolved());
    }
}
