// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

interface IXGBT {
    function stakingToken() external view returns (address);
    function balanceOf(address account) external view returns (uint256);
    function notifyRewardAmount(address _rewardsToken, uint256 reward) external;
    function addReward(address _rewardsToken) external;
}