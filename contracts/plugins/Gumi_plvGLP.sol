// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Wrapper.sol";
import '@openzeppelin/contracts/access/Ownable.sol';
import 'contracts/plugins/interfaces/IPlugin.sol';
import 'contracts/interfaces/IGumBallFactory.sol';
import 'contracts/interfaces/IXGBT.sol';
import 'contracts/interfaces/IGBT.sol';

interface IGLPManager {
    function getPrice(bool _maximise) external view returns (uint256);
}

interface IPLVGLP {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function convertToAssets(uint256 _shares) external view returns (uint256);
}

interface IPLVGLP_Farm {
    function pendingRewards(address _account) external view returns (uint256);
    function deposit(uint256 _amount) external;
    function withdraw(uint256 _amount) external;
    function harvest() external;
}

contract Gumi_plvGLP is ERC20Wrapper, Ownable, IPlugin {
    using SafeERC20 for IERC20;

    address public constant plvGLP = address(0x5326E71Ff593Ecc2CF7AcaE5Fe57582D6e74CFF1);
    address public constant PLS = address(0x51318B7D00db7ACc4026C88c3952B66278B6A67F);
    address public constant WETH = address(0x82aF49447D8a07e3bd95BD0d56f35241523fBab1);
    address public constant GLP = address(0x4277f8F2c384827B5273592FF7CeBd9f2C1ac258);
    address public constant GMX = address(0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a);
    address public constant sGLP = address(0x2F546AD4eDD93B956C8999Be404cdCAFde3E89AE);
    address public constant fsGLP = address(0x1aDDD80E6039594eE970E5872D247bf0414C8903);

    address public constant GMX_REWARD_ROUTER_V2 = address(0xB95DB5B167D75e6d04227CfFFA61069348d271F5);
    address public constant GLP_MANAGER = address(0x3963FfC9dff443c2A94f21b129D429891E32ec18);
    address public constant GLP_VAULT = address(0x489ee077994B6658eAfA855C308275EAd8097C4A);
    address public constant plvGLP_DEPOSITOR = address(0x13F0D29b5B83654A200E4540066713d50547606E);
    address public constant plvGLP_FARM = address(0x4E5Cf54FdE5E1237e80E87fcbA555d829e1307CE);

    string public constant PROTOCOL = "PlutusDAO";
    address public gumballFactory;
    address public XGBT;

    address[] public rewardTokens = [PLS];

    uint256 public constant FEE = 50;
    uint256 public constant DIVISOR = 1000;

    event Mint(address indexed user, uint256 amount);
    event Burn(address indexed user, uint256 amount);
    event Harvest(address indexed caller, uint256 amountPLS);
    event Set_Staking_Contract(address indexed owner, address stakingContract);

    constructor(address _gumballFactory) 
        ERC20("GumBall plvGLP", "gumi-plvGLP")
        ERC20Wrapper(IERC20(plvGLP))
    {
        gumballFactory = _gumballFactory;
    }

    //////////////////
    ////// View //////
    //////////////////

    function getUnderlyingTokenName() external view returns (string memory) {
        return IPLVGLP(address(underlying)).name();
    }

    function getUnderlyingTokenSymbol() external view returns (string memory) {
        return IPLVGLP(address(underlying)).symbol();
    }

    function getUnderlyingTokenAddress() external view returns (address) {
        return address(underlying);
    }

    function getProtocol() external pure returns (string memory) {
        return PROTOCOL;
    }

    function earned() external view returns (uint256) {
        return IPLVGLP_Farm(plvGLP_FARM).pendingRewards(address(this));
    }
    
    function getRewardTokens() external view returns (address[] memory) {
        return rewardTokens;
    }

    function getXGBT() external view returns (address) {
        return XGBT;
    }

    function price() external view returns (uint256) {
        return IPLVGLP(plvGLP).convertToAssets(1e18) * (IGLPManager(GLP_MANAGER).getPrice(true) * 1e18 / 1e30) / 1e18;
    }

    ////////////////////
    ///// Mutative /////
    ////////////////////

    /**
     * @dev Allow a user to deposit underlying tokens and mint the corresponding number of wrapped tokens.
     */
    function depositFor(address account, uint256 amount) public override returns (bool) {
        SafeERC20.safeTransferFrom(underlying, _msgSender(), address(this), amount);
        IERC20(plvGLP).approve(plvGLP_FARM, amount);
        IPLVGLP_Farm(plvGLP_FARM).deposit(amount);
        _mint(account, amount);
        return true;
    }

    /**
     * @dev Allow a user to burn a number of wrapped tokens and withdraw the corresponding number of underlying tokens.
     */
    function withdrawTo(address account, uint256 amount) public override returns (bool) {
        _burn(_msgSender(), amount);
        IPLVGLP_Farm(plvGLP_FARM).withdraw(uint96(amount));
        SafeERC20.safeTransfer(underlying, account, amount);
        return true;
    }

    function claimAndDistribute() external {
        IPLVGLP_Farm(plvGLP_FARM).harvest();
        uint256 tokenCount = rewardTokens.length;
        address treasury = IGumBallFactory(gumballFactory).getTreasury();
        address artist = IGBT(IXGBT(XGBT).stakingToken()).getArtist();
        for (uint i = 0; i < tokenCount; i++) {
            address token = rewardTokens[i];
            uint256 balance = IERC20(token).balanceOf(address(this));
            if (balance > 0) {
                uint256 fee = balance * FEE / DIVISOR;
                IERC20(token).safeTransfer(treasury, fee / 2);
                IERC20(token).safeTransfer(artist, fee / 2);
                IERC20(token).safeApprove(XGBT, balance - fee);
                IXGBT(XGBT).notifyRewardAmount(token, balance - fee);
            }
        }
    }

    ////////////////////
    //// Restricted ////
    ////////////////////

    function setXGBT(address _XGBT) external onlyOwner {
        XGBT = _XGBT;
    }

}