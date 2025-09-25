// SPDX-License-Identifier: MIT
pragma solidity =0.8.25;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NFTMarketplace is ReentrancyGuard {
    ERC20 public immutable i_usdc;
    uint256 private s_nftCount;
    mapping(address => mapping(uint256 => uint256)) private s_listings;

    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );
    event ItemBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );
    event ItemCanceled(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId
    );
    
    error NFTMarketplace__NotNFTOwner();
    error NFTMarketplace__PriceMustBeAboveZero();
    error NFTMarketplace__NotApprovedForMarketplace();
    error NFTMarketplace__NFTNotExist();
    error NFTMarketplace__ArrayLengthMismatch();
    error NFTMarketplace__AlreadyListed(uint256 tokenId);

    constructor(address usdcAddress) {
        i_usdc = ERC20(usdcAddress);
    }

    function offerMany(address nftAddress, uint256[] calldata tokenIds, uint256[] calldata prices) 
        external 
        nonReentrant
        {
        if(tokenIds.length != prices.length) {
            revert NFTMarketplace__ArrayLengthMismatch();
        }
        for(uint256 i = 0; i < tokenIds.length; i++) {
            _offerOne(nftAddress, tokenIds[i], prices[i]);
        }
    }

    function _offerOne(address nftAddress, uint256 tokenId, uint256 price) private {
        IERC721 nft = IERC721(nftAddress);
        if(s_listings[nftAddress][tokenId] > 0) {
            revert NFTMarketplace__AlreadyListed(tokenId);
        }
        if(nft.ownerOf(tokenId) == address(0)) {
            revert NFTMarketplace__NFTNotExist();
        }
        if(nft.ownerOf(tokenId) != msg.sender) {
            revert NFTMarketplace__NotNFTOwner();
        }
        if(price <= 0) {
            revert NFTMarketplace__PriceMustBeAboveZero();
        }
        if(nft.getApproved(tokenId) != address(this) && !nft.isApprovedForAll(msg.sender, address(this))) {
            revert NFTMarketplace__NotApprovedForMarketplace();
        }
        s_listings[nftAddress][tokenId] = price;
        assembly{
            sstore(s_nftCount.slot, add(sload(s_nftCount.slot), 1))
        }
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    function _buyOne(address nftAddress, uint256 tokenId) private {
        IERC721 nft = IERC721(nftAddress);
        uint256 price = s_listings[nftAddress][tokenId];
        address seller = nft.ownerOf(tokenId);
        if(price <= 0) {
            revert NFTMarketplace__NFTNotExist();
        }
        delete(s_listings[nftAddress][tokenId]);
        assembly{
            sstore(s_nftCount.slot, sub(sload(s_nftCount.slot), 1))
        }
        i_usdc.transferFrom(msg.sender, seller, price);
        nft.safeTransferFrom(seller, msg.sender, tokenId);
        emit ItemBought(msg.sender, nftAddress, tokenId, price);
    }

    function buyMany(address nftAddress, uint256[] calldata tokenIds) 
        external 
        nonReentrant
        {
        for(uint256 i = 0; i < tokenIds.length; i++) {
            _buyOne(nftAddress, tokenIds[i]);
        }
    }

    function cancelListing(address nftAddress, uint256 tokenId) 
        external 
        nonReentrant
        {
        IERC721 nft = IERC721(nftAddress);
        if(nft.ownerOf(tokenId) != msg.sender) {
            revert NFTMarketplace__NotNFTOwner();
        }
        if(s_listings[nftAddress][tokenId] <= 0) {
            revert NFTMarketplace__NFTNotExist();
        }
        delete(s_listings[nftAddress][tokenId]);
        assembly{
            sstore(s_nftCount.slot, sub(sload(s_nftCount.slot), 1))
        }
        emit ItemCanceled(msg.sender, nftAddress, tokenId);
    }

    function getListing(address nftAddress, uint256 tokenId) external view returns (uint256) {
        return s_listings[nftAddress][tokenId];
    }

    function getNFTCount() external view returns (uint256) {
        return s_nftCount;
    }
}