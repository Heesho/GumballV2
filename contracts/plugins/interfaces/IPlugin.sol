// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

interface IPlugin {
    function getUnderlyingTokenName() external view returns (string memory);
    function getUnderlyingTokenSymbol() external view returns (string memory);
    function getUnderlyingTokenAddress() external view returns (address);
    function getProtocol() external view returns (string memory);
    function getXGBT() external view returns (address);
    function getRewardTokens() external view returns (address[] memory);
    function price() external view returns (uint);
    function claimAndDistribute() external;
    function setXGBT(address _XGBT) external;
}