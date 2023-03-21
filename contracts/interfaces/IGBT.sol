// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

interface IGBT {
    function mustStayGBT(address account) external view returns (uint256);
    function getArtist() external view returns (address);
    function setXGBT(address _XGBT) external;
    function updateAllowlist(address[] memory accounts, uint256 amount) external;
    function getXGBT() external view returns (address);
    function getFactory() external view returns (address);
    function artistTreasury() external view returns (address);
    function currentPrice() external view returns (uint256);
    function getProtocol() external view returns (address);
    function initSupply() external view returns (uint256);
    function getFees() external view returns (address);
}

