// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract MarketPlace {

    function grabNFT(address nft, uint256 id) public {
        IERC721(nft).safeTransferFrom(msg.sender, address(this), id);
    }

    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) public view returns (bytes4) {
        return IERC721Receiver(address(this)).onERC721Received.selector;
    }
}