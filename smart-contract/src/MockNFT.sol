// SPDX-License-Identifier: MIT
pragma solidity =0.8.25;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract MockNFT is ERC721 {
    uint256 private s_tokenId;

    constructor() ERC721("MockNFT", "MNFT") {}

    function mint() external {
        s_tokenId++;
        _safeMint(msg.sender, s_tokenId);
    }

    function getTokenId() external view returns (uint256) {
        return s_tokenId;
    }
}