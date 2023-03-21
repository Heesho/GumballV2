// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

interface IXGBTFactory {
    function createXGBT(
        address _owner,
        address _stakingToken,
        address _stakingNFT
    ) external returns (address);
}