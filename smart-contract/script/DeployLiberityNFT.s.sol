// SPDX-License-Identifier: MIT
pragma solidity =0.8.25;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {LibertyNFT} from "src/LibertyNFT.sol";
import {Script} from "forge-std/Script.sol";

contract DeployLiberityNFT is Script {
    function run() public returns (address) {
        vm.startBroadcast();
        LibertyNFT libertyNFT = new LibertyNFT();
        return address(libertyNFT);
    }
}