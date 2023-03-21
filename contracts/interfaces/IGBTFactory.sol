// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

interface IGBTFactory {
    function createGBT(
        string memory _name,
        string memory _symbol,
        address _baseToken,
        uint256 _initialVirtualBASE,
        uint256 _supplyGBT,
        address _artist,
        address _factory,
        uint256 _delay,
        uint256 _fee
    ) external returns (address);
}