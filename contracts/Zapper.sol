// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

interface IFactory {
    function totalDeployed() external view returns (uint256 length);
    function tokensDeployed(uint256 index) external view returns (address gbt);
    function gumballsDeployed(uint256 index) external view returns (address gumball);
}

interface IBondingCurve {
    function currentPrice() external view returns (uint256);
    function buy(uint256 _amountBASE, uint256 _minGBT, uint256 expireTimestamp) external;
    function sell(uint256 _amountGBT, uint256 _minETH, uint256 expireTimestamp) external;
    function BASE_TOKEN() external view returns (address);
}

interface IGumball {
    function swapForExact(uint256[] memory id) external;
    function swap(uint256 _amount) external;
    function redeem(uint256[] memory _id) external;
    function gumballs() external view returns (uint256[] memory arr);
    function totalSupply() external view returns (uint256);
    function setApprovalForAll(address spender, bool _bool) external;
}

contract GumballZapper is Ownable, Pausable, ReentrancyGuard {

    address factory;
    IERC20 ETH;

    struct Txn {
        address _token;
        uint256 _amount;
        bytes14 _type;
        address _base;
        uint256 _excessBase;
        uint256 _excessGBT;
    }

    struct Request {
        address token;
        uint256 amountIn;
        uint256 amountOut;
        uint256[] id;
        bool ownedByProtocol;
    }

    constructor(
        address _factory,
        address _ETH
    ) {
        ETH = IERC20(_ETH);
        factory = _factory;
    }

    function zapEthIn(Request[] memory request) external whenNotPaused {

        Txn[] memory t = new Txn[](request.length);

        uint256 totalETH = 0;
        uint256 reserveETH = ETH.balanceOf(address(this));

        for (uint256 i = 0; i < request.length; i++) {
            totalETH += request[i].amountIn;
        }

        ETH.transferFrom(msg.sender, address(this), totalETH);

        for (uint i = 0; i < request.length; i++) {
            bytes14 response;
            uint256 index;

            (index, response) = findDeployment(request[i].token);

            if (response == bytes14('token')) {

                uint256 bef = IERC20(IFactory(factory).tokensDeployed(index)).balanceOf(address(this));
                verifyApproval(IFactory(factory).tokensDeployed(index), request[i].amountIn, address(ETH));
                IBondingCurve(IFactory(factory).tokensDeployed(index)).buy(request[i].amountIn, 0, 0);
                uint256 aft = IERC20(IFactory(factory).tokensDeployed(index)).balanceOf(address(this));

                t[i]._token = IFactory(factory).tokensDeployed(index);
                t[i]._amount = aft - bef;
                t[i]._type = bytes14('token');
                t[i]._base = IFactory(factory).tokensDeployed(index);
                t[i]._excessBase = totalETH - ETH.balanceOf(address(this));
                t[i]._excessGBT = 0;
            }

            if (response == bytes14('gumball')) {

                uint256 bef = IERC20(IFactory(factory).tokensDeployed(index)).balanceOf(address(this));
                verifyApproval(IFactory(factory).tokensDeployed(index), request[i].amountIn, address(ETH));
                uint256 beforeGBT = IERC20(IFactory(factory).tokensDeployed(index)).balanceOf(address(this));
                IBondingCurve(IFactory(factory).tokensDeployed(index)).buy(request[i].amountIn, 0, 0);
                uint256 afterGBT = IERC20(IFactory(factory).tokensDeployed(index)).balanceOf(address(this));
                verifyApproval(IFactory(factory).gumballsDeployed(index), afterGBT - beforeGBT, IFactory(factory).tokensDeployed(index));

                if (request[i].ownedByProtocol) {
                    IGumball(IFactory(factory).gumballsDeployed(index)).swapForExact(request[i].id);
                } else {
                    IGumball(IFactory(factory).gumballsDeployed(index)).swap(request[i].amountOut);
                }

                uint256 aft = IERC20(IFactory(factory).tokensDeployed(index)).balanceOf(address(this));

                t[i]._token = IFactory(factory).gumballsDeployed(index);
                t[i]._amount = request[i].amountOut;
                t[i]._type = bytes14('gumball');
                t[i]._base = IFactory(factory).tokensDeployed(index);
                t[i]._excessBase = totalETH - ETH.balanceOf(address(this));
                t[i]._excessGBT = aft - bef;
            }
        }

        for (uint256 i = 0; i < t.length; i++) {

            if (t[i]._type == bytes14('token')) {
                IERC20(t[i]._token).transfer(msg.sender, t[i]._amount + t[i]._excessGBT);
            } else if (t[i]._type == bytes14('gumball')) {

                (uint256 index, ) = findDeployment(t[i]._token);

                if (request[i].ownedByProtocol) {
                    for (uint256 j = 0; j < request[i].amountOut / 1e18; j++) {
                        IERC721(t[i]._token).transferFrom(address(this), msg.sender, request[i].id[j]);
                    }
                } else {
                    for (uint256 j = 1; j <= request[i].amountOut / 1e18; j++) {
                        IERC721(t[i]._token).transferFrom(address(this), msg.sender, IGumball(IFactory(factory).gumballsDeployed(index)).totalSupply() - j);
                    }  
                }

                IERC20(IFactory(factory).tokensDeployed(index)).transfer(msg.sender, t[i]._excessGBT);
            }
        }

        uint256 remaining = ETH.balanceOf(address(this)) - reserveETH;

        if (remaining > 0) {
            ETH.transfer(msg.sender, remaining);
        }
    }

    // A burn will occur
    function zapEthOut(Request[] memory request) external whenNotPaused {

        for (uint256 i = 0; i < request.length; i++) {
            bytes14 response;
            uint256 index;

            (index, response) = findDeployment(request[i].token);

            if (response == bytes14('token')) {
                IERC20(request[i].token).transferFrom(msg.sender, address(this), request[i].amountIn);
                verifyApproval(IFactory(factory).tokensDeployed(index), request[i].amountIn, request[i].token);
                IBondingCurve(IFactory(factory).tokensDeployed(index)).sell(request[i].amountIn, 0, 0);
            }

            if (response == bytes14('gumball')) {

                uint256[] memory idList = new uint256[](request[i].id.length);

                uint256 bef = IERC20(IFactory(factory).tokensDeployed(index)).balanceOf(address(this));

                IGumball(IFactory(factory).gumballsDeployed(index)).setApprovalForAll(IFactory(factory).gumballsDeployed(index), true);

                for (uint256 idx = 0; idx < request[i].id.length; idx++) {
                    IERC721(request[i].token).transferFrom(msg.sender, address(this), request[i].id[idx]);
                    idList[idx] = request[i].id[idx];
                }
                
                IGumball(IFactory(factory).gumballsDeployed(index)).redeem(idList);
                uint256 aft = IERC20(IFactory(factory).tokensDeployed(index)).balanceOf(address(this));
                verifyApproval(IFactory(factory).tokensDeployed(index), aft - bef, IFactory(factory).tokensDeployed(index));
                IBondingCurve(IFactory(factory).tokensDeployed(index)).sell(aft - bef, 0, 0);
            }
        }

        ETH.transfer(msg.sender, ETH.balanceOf(address(this)));
    }

    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) public view returns (bytes4) {
        return IERC721Receiver(address(this)).onERC721Received.selector;
    }

    function verifyApproval(address spender, uint256 amount, address token) internal {
        if (IERC20(token).allowance(address(this), spender) < amount) {
            IERC20(token).approve(spender, amount);
        }
    }

    function findToken(address[] memory tokens, address tokenToFind) public view returns (int256) {

        bool found = false;

        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == tokenToFind) {
                found = true;
                return int256(i);
            }
        }

        if (!found) {
            return -1;
        }
    } 

    function findDeployment(address toFind) public view returns (uint256 _index, bytes14 _type) {

        bool found = false;

        for(uint256 i = 0; i < IFactory(factory).totalDeployed(); i++) {
            
            if (IFactory(factory).tokensDeployed(i) == toFind) {
                found = true;
                return (i, bytes14('token'));
            } else if (IFactory(factory).gumballsDeployed(i) == toFind) {
                found = true;
                return (i, bytes14('gumball'));
            }
        }

        if (!found) {
            revert ('Address not found!');
        }
    }
}