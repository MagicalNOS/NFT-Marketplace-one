// SPDX-License-Identifier: MIT
pragma solidity =0.8.25;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract LibertyNFT is ERC721 {
    error ERC721Metadata__URI_QueryFor_NonExistentToken();
    constructor() ERC721("LibertyNFT", "LIBERTY"){}

    mapping (uint256 => string) public s_tokenIdToURI;
    uint256 s_tokenCounter = 0;

    function mintNFT(string memory _tokenURI) public {
        _safeMint(msg.sender,s_tokenCounter);
        s_tokenIdToURI[s_tokenCounter] = _tokenURI;
        s_tokenCounter++;
    }

    function totalSupply() public view returns (uint256) {
        return s_tokenCounter;
    }
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if(_ownerOf(tokenId) == address(0)){
            revert ERC721Metadata__URI_QueryFor_NonExistentToken();
        }
        string memory imageURI = s_tokenIdToURI[tokenId];
        return imageURI;
    }
}