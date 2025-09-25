// SPDX-License-Identifier: MIT
pragma solidity =0.8.25;

import {MockUSDC} from "src/MockUSDC.sol";
import {NFTMarketplace} from "src/NFTMarketplace.sol";
import {Script} from "forge-std/Script.sol";

contract DeployNFTMarketplace is Script {
    function run() external returns (NFTMarketplace, MockUSDC) {
        vm.startBroadcast();
        MockUSDC usdc = new MockUSDC();
        NFTMarketplace marketplace = new NFTMarketplace(address(usdc));
        vm.stopBroadcast();
        return (marketplace, usdc);
    }
}