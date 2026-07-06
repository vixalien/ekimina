// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../Ikimina.sol";
import "../MockUSDm.sol";

contract IkiminaFactoryTest is Test {
    MockUSDm public token;
    IkiminaFactory public factory;
    Ikimina.Config public config;

    address public creator = address(0x1);
    address public caller = address(0x5);
    bytes32 public inviteHash = keccak256("ABCDE");
    bytes32 public secondHash = keccak256("FGHIJ");

    uint256 public constant CONTRIBUTION = 10 ether;

    function setUp() public {
        token = new MockUSDm();
        factory = new IkiminaFactory(IERC20(address(token)));

        config = Ikimina.Config({
            contributionAmount: CONTRIBUTION,
            cycleLength: 1 days,
            payoutAmount: 5 ether,
            payoutPolicy: Ikimina.PayoutPolicy.Rotating,
            penaltyRateBps: 500,
            approvalThresholdBps: 5000,
            loansEnabled: true,
            discretionaryEnabled: true,
            allMembersCommittee: true
        });
    }

    function testCreatesMultipleGroups() public {
        vm.prank(creator);
        factory.createGroup(config, inviteHash);

        vm.prank(creator);
        factory.createGroup(config, secondHash);

        assertEq(factory.allGroupsLength(), 2);
    }

    function testEachGroupIsUnique() public {
        vm.prank(creator);
        address g1 = factory.createGroup(config, inviteHash);

        vm.prank(creator);
        address g2 = factory.createGroup(config, secondHash);

        assertTrue(g1 != g2);

        Ikimina group1 = Ikimina(g1);
        Ikimina group2 = Ikimina(g2);

        assertEq(group1.inviteCodeHash(), inviteHash);
        assertEq(group2.inviteCodeHash(), secondHash);
    }

    function testFactoryTokenIsCorrect() public {
        assertEq(address(factory.token()), address(token));
    }

    function testAnyoneCanCreateGroup() public {
        vm.prank(caller);
        address g = factory.createGroup(config, inviteHash);

        assertEq(factory.allGroupsLength(), 1);
        assertEq(Ikimina(g).inviteCodeHash(), inviteHash);
    }
}
