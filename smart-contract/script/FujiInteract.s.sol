// SPDX-License-Identifier: MIT
pragma solidity =0.8.25;

import {MockNFT} from "src/MockNFT.sol";
import {NFTMarketplace} from "src/NFTMarketplace.sol";
import {Script} from "forge-std/Script.sol";
import {DevOpsTools} from "@foundry-devops/src/DevOpsTools.sol";
import {LibertyNFT} from "src/LibertyNFT.sol";

contract FujiInteract is Script {
    address nftAddress;
    address marketplaceAddress;
    function run() external {
        nftAddress = DevOpsTools.get_most_recent_deployment("MockNFT", 43113);
        marketplaceAddress = DevOpsTools.get_most_recent_deployment("NFTMarketplace", 43113);
        vm.startBroadcast();
        listALibertyNFT();
        vm.stopBroadcast();
    }

    function mintAndListANFT() public {
        MockNFT nft = MockNFT(nftAddress);
        nft.mint();
        nft.approve(marketplaceAddress, 4);
        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = 4;
        uint256[] memory prices = new uint256[](1);
        prices[0] = 10e6;
        NFTMarketplace(marketplaceAddress).offerMany(nftAddress, tokenIds, prices);
    }

    function cancelListing() public {
        NFTMarketplace marketplace = NFTMarketplace(marketplaceAddress);
        marketplace.cancelListing(nftAddress, 1);
        marketplace.cancelListing(nftAddress, 2);
    }

    function listALibertyNFT() public{
        address libertyNFTAddress = DevOpsTools.get_most_recent_deployment("LibertyNFT", 43113);
        LibertyNFT libertyNFT = LibertyNFT(libertyNFTAddress);
        libertyNFT.mintNFT("ipfs://bafybeibc5sgo2plmjkq2tzmhrn54bk3crhnc23zd2msg4ea7a4pxrkgfna/4356");
        libertyNFT.approve(marketplaceAddress, 2);
        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = 2;
        uint256[] memory prices = new uint256[](1);
        prices[0] = 193e5;
        NFTMarketplace(marketplaceAddress).offerMany(libertyNFTAddress, tokenIds, prices);
    }
}