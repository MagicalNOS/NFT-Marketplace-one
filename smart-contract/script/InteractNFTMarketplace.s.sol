// SPDX-License-Identifier: MIT
pragma solidity =0.8.25;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {MockNFT} from "src/MockNFT.sol";
import {MockUSDC} from "src/MockUSDC.sol";
import {NFTMarketplace} from "src/NFTMarketplace.sol";
import {Script} from "forge-std/Script.sol";
import {DevOpsTools} from "@foundry-devops/src/DevOpsTools.sol";

contract InteractNFTMarketplace is Script {
    function run() external {
        address marketplaceAddress = DevOpsTools.get_most_recent_deployment("NFTMarketplace",31337);
        vm.startBroadcast();
        NFTMarketplace marketplace = NFTMarketplace(marketplaceAddress);
        MockNFT nft = new MockNFT();
        nft.mint();
        nft.mint();
        nft.mint();
        nft.approve(marketplaceAddress, 1);
        nft.approve(marketplaceAddress, 2);
        nft.approve(marketplaceAddress, 3);
        uint256[] memory tokenIds = new uint256[](3);
        tokenIds[0] = 1;
        tokenIds[1] = 2;
        tokenIds[2] = 3;
        uint256[] memory prices = new uint256[](3);
        prices[0] = 10e6;
        prices[1] = 20e6;
        prices[2] = 30e6;
        marketplace.offerMany(address(nft), tokenIds, prices);
    }


}