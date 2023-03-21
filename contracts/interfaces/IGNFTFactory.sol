// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

interface IGNFTFactory {
    function createGNFT(
        string memory _name,
        string memory _symbol,
        string[] memory _URIs,
        address _GBT,
        uint256 _bFee
    ) external returns (address);
}