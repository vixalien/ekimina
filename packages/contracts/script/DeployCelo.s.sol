// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {IkiminaFactory} from "../contracts/Ikimina.sol";
import {MockUSDm} from "../contracts/MockUSDm.sol";

contract DeployCelo is Script {
    function run() external {
        address tokenAddress = vm.envOr("TOKEN_ADDRESS", address(0));

        vm.startBroadcast();

        MockUSDm usdm;
        if (tokenAddress == address(0)) {
            usdm = new MockUSDm();
        } else {
            usdm = MockUSDm(tokenAddress);
        }

        IkiminaFactory factory = new IkiminaFactory(usdm);

        vm.stopBroadcast();

        console.log("MockUSDm deployed to:", address(usdm));
        console.log("IkiminaFactory deployed to:", address(factory));
    }
}
