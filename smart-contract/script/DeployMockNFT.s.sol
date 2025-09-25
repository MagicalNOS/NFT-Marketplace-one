// SPDX-License-Identifier: MIT
pragma solidity =0.8.25;

import {MockNFT} from "src/MockNFT.sol";
import {Script} from "forge-std/Script.sol";

contract DeployMockNFT is Script {
    function run() external {
        vm.startBroadcast();
        new MockNFT();
        vm.stopBroadcast();
    }
}