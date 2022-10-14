const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const divDec = (amount, decimals = 18) => amount/10**decimals;
const { inputToConfig } = require("@ethereum-waffle/compiler");
const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { execPath } = require("process");

const AddressZero = '0x0000000000000000000000000000000000000000'
const MINIMUM_LIQUIDITY = "1000"
const one = convert('1', 18);
const two = convert('2', 18);
const three = convert('3', 18);
const four = convert('4', 18);
const five = convert('5', 18);
const ten = convert('10', 18);
const fifty = convert('50', 18)
const oneHundred = convert('100', 18);
const twoHundred = convert('200', 18);
const fiveHundred = convert('500', 18);
const eightHundred = convert('800', 18);
const oneThousand = convert('1000', 18);
const April2026 = '1775068986';
const May2026 = '1776278586';
const oneWeek = 604800;
const oneday = 24*3600;
const twodays = 2*24*3600;
const spiritPerBlock = "10000000000000000000";
const startBlock = "1";
const startTime = Math.floor(Date.now() / 1000);

//testing

// users
let owner, admin, user1, user2, user3, gumbar, artist, protocol, gumball;
let weth, GBT, XGBT, GNFT, USDC;

describe("System Testing", function () {
  
    before("Initial set up", async function () {
        console.log("Begin Initialization");

        // initialize users
        [owner, admin, user1, user2, user3, gumbar, artist, protocol, gumball] = await ethers.getSigners();

        // initialize tokens
        // mints 1000 tokens to deployer
        const erc20Mock = await ethers.getContractFactory("ERC20Mock");
        weth = await erc20Mock.deploy("WETH", "WETH");
        USDC = await erc20Mock.deploy("USDC", "USDC")
        await weth.mint(user1.address, oneThousand);
        await weth.mint(user2.address, oneThousand);
        await weth.mint(user3.address, oneThousand);
        console.log("- Tokens Initialized");

        // initialize ERC20BondingCurve
        const GBTArtifact = await ethers.getContractFactory("ERC20BondingCurve");
        const GBTContract = await GBTArtifact.deploy();
        GBT = await ethers.getContractAt("ERC20BondingCurve", GBTContract.address);
        console.log("- ER20 Bonding Curve Initialized");

        await GBT.initialize('GumBall Token 1', 
                             'GBT1',
                             weth.address,
                             oneHundred,
                             oneHundred,
                             gumball.address,
                             gumbar.address,
                             artist.address,
                             protocol.address,
                             0
                             );

        const GNFTArtifact = await ethers.getContractFactory("Gumball");
        const GNFTContract = await GNFTArtifact.deploy();
        GNFT = await ethers.getContractAt("Gumball", GNFTContract.address);

        await GNFT.initialize("Gumball Collection 1",
                            "GBT1",
                            ["http", ""],
                            GBT.address
                            );


        console.log("- Gumball Initialized");

        // initialize Gumbar 
        const XGBTArtifact = await ethers.getContractFactory("Gumbar");
        const XGBTContract = await XGBTArtifact.deploy(protocol.address, GBT.address, GNFT.address);
        XGBT = await ethers.getContractAt("Gumbar", XGBTContract.address);
        await GBT.setGumbar(XGBT.address);
        await XGBT.connect(protocol).addReward(GBT.address, GBT.address);
        await XGBT.connect(protocol).addReward(weth.address, GBT.address);
        console.log("- Gumbar Initialized");
        
        console.log("Initialization Complete");
        console.log("******************************************************");
    });

    /////////////

    it('User1 Buys GBT with 10 WETH', async function () {
        console.log("******************************************************");

        await weth.connect(user1).approve(GBT.address, ten);
        await GBT.connect(user1).buy(ten, 1, 1682282187);

    });

    it('User1 converts 1 GBT to 1 gNFT', async function () {
        console.log("******************************************************");

        await GBT.connect(user1).approve(GNFT.address, one);
        await GNFT.connect(user1).swap(one);

    });

    it('User1 converts NFT to GBT', async function () {
        console.log("******************************************************");

        let tokenID = await GNFT.tokenOfOwnerByIndex(user1.address, 0);        
        await GNFT.connect(user1).approve(GNFT.address, tokenID);
        await GNFT.connect(user1).redeem([0]);

    });

    it('User2 Buys GBT with 10 WETH', async function () {
        console.log("******************************************************");

        await weth.connect(user2).approve(GBT.address, ten);
        await GBT.connect(user2).buy(ten, 1, 1682282187);

    });

    it('User2 buys gNFT that User1 sold', async function () {
        console.log("******************************************************");

        await GBT.connect(user2).approve(GNFT.address, one);
        await GNFT.connect(user2).swapForExact([await GNFT.gumballs(0)]);

    });

    it('User1 fails to buy gNFT that User2 bought', async function () {
        console.log("******************************************************");

        await GBT.connect(user1).approve(GNFT.address, one);
        await expect(GNFT.connect(user1).swapForExact([0])).to.be.revertedWith("Error");

    });

    it('User2 converts 3 GBT to 3 gNFT', async function () {
        console.log("******************************************************");

        await GBT.connect(user2).approve(GNFT.address, three);
        await GNFT.connect(user2).swap(three);

    });

    it('User2 converts 4 NFT to GBTs', async function () {
        console.log("******************************************************");

        let tokenID = await GNFT.tokenOfOwnerByIndex(user2.address, 0);
        let tokenID2 = await GNFT.tokenOfOwnerByIndex(user2.address, 1);
        let tokenID3 = await GNFT.tokenOfOwnerByIndex(user2.address, 2);
        let tokenID4 = await GNFT.tokenOfOwnerByIndex(user2.address, 3);

        await GNFT.connect(user2).approve(GNFT.address, tokenID);
        await GNFT.connect(user2).approve(GNFT.address, tokenID2);
        await GNFT.connect(user2).approve(GNFT.address, tokenID3);
        await GNFT.connect(user2).approve(GNFT.address, tokenID4);
        
        await GNFT.connect(user2).redeem([tokenID]);
        await GNFT.connect(user2).redeem([tokenID2]);
        await GNFT.connect(user2).redeem([tokenID3]);
        await GNFT.connect(user2).redeem([tokenID4]);

    });

    it('User1 buys 2nd gNFT that User2 sold', async function () {
        console.log("******************************************************");

        await GBT.connect(user1).approve(GNFT.address, one);
        await GNFT.connect(user1).swapForExact([await GNFT.gumballs(2)]);

    });

    // it('User1 rebuys original NFT that User1 sold to User2', async function () {
    //     console.log("******************************************************");

    //     await GBT.connect(user1).approve(GNFT.address, one);
    //     await GNFT.connect(user1).swapForExact([0]);
    // });

    // //////////

    // it('User1 Buys GBT with 10 WETH', async function () {
    //     console.log("******************************************************");

    //     await weth.connect(user1).approve(GBT.address, ten);
    //     await GBT.connect(user1).buy(ten, 1, 1682282187);

    // });

    // it('User1 converts 1 GBT to 1 gNFT', async function () {
    //     console.log("******************************************************");

    //     await GBT.connect(user1).approve(GNFT.address, one);
    //     await GNFT.connect(user1).swap(one);

    // });

    // it('User1 sells rest of GBT', async function () {
    //     console.log("******************************************************");

    //     let user1Balance = await GBT.balanceOf(user1.address);

    //     await GBT.connect(user1).approve(GBT.address, user1Balance);
    //     await GBT.connect(user1).sell(user1Balance, 1, 1682282187);

    // });

    // it('User1 stakes 1 gNFT', async function () {
    //     console.log("******************************************************");

    //     let tokenID = await GNFT.tokenOfOwnerByIndex(user1.address, 0);
    //     await GNFT.connect(user1).approve(XGBT.address, tokenID);
    //     await XGBT.connect(user1).depositNFT([tokenID]);

    // });

    // it('User1 unstakes GBT', async function () {
    //     console.log("******************************************************");

    //     await expect(XGBT.connect(user1).withdrawToken(await XGBT.balanceOf(user1.address))).to.be.revertedWith("Insufficient balance");

    // });

    // it('User1 unstakes wrong NFT', async function () {
    //     console.log("******************************************************");

    //     await expect(XGBT.connect(user1).withdrawNFT([1])).to.be.revertedWith("!Found");

    // });

    // it('User2 Buys GBT with 10 WETH', async function () {
    //     console.log("******************************************************");

    //     await weth.connect(user2).approve(GBT.address, ten);
    //     await GBT.connect(user2).buy(ten, 1, 1682282187);

    // });

    // it('User2 converts 1 GBT to 1 gNFT', async function () {
    //     console.log("******************************************************");

    //     await GBT.connect(user2).approve(GNFT.address, one);
    //     await GNFT.connect(user2).swap(one);

    // });

    // it('User2 sells rest of GBT', async function () {
    //     console.log("******************************************************");

    //     let user2Balance = await GBT.balanceOf(user2.address);

    //     await GBT.connect(user2).approve(GBT.address, user2Balance);
    //     await GBT.connect(user2).sell(user2Balance, 1, 1682282187);

    //     // await GBT.connect(user2).approve(GBT.address, ten);
    //     // await GBT.connect(user2).sell(await GBT.balanceOf(user2.address), 1, 1682282187);

    // });

    // it('User2 stakes 1 gNFT', async function () {
    //     console.log("******************************************************");

    //     let tokenID = await GNFT.tokenOfOwnerByIndex(user2.address, 0);
    //     await GNFT.connect(user2).approve(XGBT.address, tokenID);
    //     await XGBT.connect(user2).depositNFT([tokenID]);

    // });

    // it('User1 unstakes user2s NFT', async function () {
    //     console.log("******************************************************");

    //     await expect(XGBT.connect(user1).withdrawNFT([1])).to.be.revertedWith("!Found");

    // });

    // it('User1 unstakes NFT', async function () {
    //     console.log("******************************************************");

    //     await XGBT.connect(user1).withdrawNFT([0]);

    // });

    // it('User1 converts NFT to GBT', async function () {
    //     console.log("******************************************************");

    //     let tokenID = await GNFT.tokenOfOwnerByIndex(user1.address, 0);
    //     await GNFT.connect(user1).approve(GNFT.address, tokenID);
    //     await GNFT.connect(user1).redeem([0]);

    // });

    // it('User2 borrows max against position', async function () {
    //     console.log("******************************************************");

    //     await GBT.connect(user2).borrowMax();

    // });

    // it('User2 withdraws NFT', async function () {
    //     console.log("******************************************************");

    //     await expect(XGBT.connect(user2).withdrawToken(await XGBT.balanceOf(user2.address))).to.be.revertedWith("Insufficient balance");
    //     await expect(XGBT.connect(user2).withdrawNFT([1])).to.be.revertedWith("Borrow debt");

    // });

    // it('User2 Buys GBT with 10 WETH', async function () {
    //     console.log("******************************************************");

    //     await weth.connect(user2).approve(GBT.address, ten);
    //     await GBT.connect(user2).buy(ten, 1, 1682282187);

    // });

    // it('User2 stakes GBT', async function () {
    //     console.log("******************************************************");

    //     await GBT.connect(user2).approve(XGBT.address, ten);
    //     await XGBT.connect(user2).depositToken(await GBT.balanceOf(user2.address));

    // });

    // it('User2 unstakes NFT', async function () {
    //     console.log("******************************************************");

    //     await XGBT.connect(user2).withdrawNFT([1]);

    // });

    // it('User2 unstakes GBT', async function () {
    //     console.log("******************************************************");

    //     await expect(XGBT.connect(user2).withdrawToken(await XGBT.balanceOf(user2.address))).to.be.revertedWith("Borrow debt");
    //     await XGBT.connect(user2).withdrawToken((await XGBT.balanceOf(user2.address)).sub(one));

    // });

    // it('User2 converts NFT to GBT', async function () {
    //     console.log("******************************************************");

    //     let tokenID = await GNFT.tokenOfOwnerByIndex(user2.address, 0);
    //     await GNFT.connect(user2).approve(GNFT.address, tokenID);
    //     await GNFT.connect(user2).redeem([tokenID]);

    // });

    // it('User2 borrows max against position', async function () {
    //     console.log("******************************************************");

    //     await GBT.connect(user2).borrowMax();

    // });

    // it('User2 calls treasury skim', async function () {
    //     console.log("******************************************************");

    //     await GBT.connect(user2).treasurySkim();

    // });

    // it('Forward 7 days', async function () {
    //     console.log("******************************************************");

    //     await network.provider.send('evm_increaseTime', [7*24*3600]); 
    //     await network.provider.send('evm_mine');

    // });

    // it('User2 claims rewards', async function () {
    //     console.log("******************************************************");

    //     await XGBT.connect(user2).getReward();

    // });

    // it('User3 Buys GBT with 100 WETH', async function () {
    //     console.log("******************************************************");

    //     await weth.connect(user3).approve(GBT.address, oneHundred);
    //     await GBT.connect(user3).buy(oneHundred, 1, 1682282187);

    // });

    // it('User3 converts 10 GBT to NFT', async function () {
    //     console.log("******************************************************");

    //     await GBT.connect(user3).approve(GNFT.address, ten);
    //     await GNFT.connect(user3).swap(ten);

    // });

    // it('User3 stakes 5 NFT', async function () {
    //     console.log("******************************************************");

    //     let tokenID1 = await GNFT.tokenOfOwnerByIndex(user3.address, 0);
    //     let tokenID2 = await GNFT.tokenOfOwnerByIndex(user3.address, 1);
    //     let tokenID3 = await GNFT.tokenOfOwnerByIndex(user3.address, 2);
    //     let tokenID4 = await GNFT.tokenOfOwnerByIndex(user3.address, 3);
    //     let tokenID5 = await GNFT.tokenOfOwnerByIndex(user3.address, 4);
    //     await GNFT.connect(user3).approve(XGBT.address, tokenID1);
    //     await GNFT.connect(user3).approve(XGBT.address, tokenID2);
    //     await GNFT.connect(user3).approve(XGBT.address, tokenID3);
    //     await GNFT.connect(user3).approve(XGBT.address, tokenID4);
    //     await GNFT.connect(user3).approve(XGBT.address, tokenID5);
    //     await XGBT.connect(user3).depositNFT([tokenID1, tokenID2, tokenID3, tokenID4, tokenID5]);
    // });

    // it('User3 borrows some ETH against position', async function () {
    //     console.log("******************************************************");

    //     await GBT.connect(user3).borrowSome(two);

    // });

    // it('User3 unstakes 3 NFT', async function () {
    //     console.log("******************************************************");

    //     let tokenID1 = await XGBT.balanceNFT(user3.address, 0);
    //     let tokenID2 = await XGBT.balanceNFT(user3.address, 1);
    //     let tokenID3 = await XGBT.balanceNFT(user3.address, 2);
    //     await XGBT.connect(user3).withdrawNFT([tokenID1, tokenID2, tokenID3]);

    // });

    // it('User3 redeems 8 NFT for GBT', async function () {
    //     console.log("******************************************************");

    //     let tokenID1 = await GNFT.tokenOfOwnerByIndex(user3.address, 0);
    //     let tokenID2 = await GNFT.tokenOfOwnerByIndex(user3.address, 1);
    //     let tokenID3 = await GNFT.tokenOfOwnerByIndex(user3.address, 2);
    //     let tokenID4 = await GNFT.tokenOfOwnerByIndex(user3.address, 3);
    //     let tokenID5 = await GNFT.tokenOfOwnerByIndex(user3.address, 4);
    //     let tokenID6 = await GNFT.tokenOfOwnerByIndex(user3.address, 5);
    //     let tokenID7 = await GNFT.tokenOfOwnerByIndex(user3.address, 6);
    //     let tokenID8 = await GNFT.tokenOfOwnerByIndex(user3.address, 7);
    //     await GNFT.connect(user3).approve(GNFT.address, tokenID1);
    //     await GNFT.connect(user3).approve(GNFT.address, tokenID2);
    //     await GNFT.connect(user3).approve(GNFT.address, tokenID3);
    //     await GNFT.connect(user3).approve(GNFT.address, tokenID4);
    //     await GNFT.connect(user3).approve(GNFT.address, tokenID5);
    //     await GNFT.connect(user3).approve(GNFT.address, tokenID6);
    //     await GNFT.connect(user3).approve(GNFT.address, tokenID7);
    //     await GNFT.connect(user3).approve(GNFT.address, tokenID8);
    //     await GNFT.connect(user3).redeem([tokenID1, tokenID2, tokenID3, tokenID4, tokenID5, tokenID6, tokenID7, tokenID8]);
        
    // });

    // it('User2 and User3 borrows max against position', async function () {
    //     console.log("******************************************************");

    //     await GBT.connect(user2).borrowMax();
    //     await GBT.connect(user3).borrowMax();

    // });

    // it('User2 repays some eth back', async function () {
    //     console.log("******************************************************");

    //     await weth.connect(user2).approve(GBT.address, one);
    //     await GBT.connect(user2).repaySome(one);

    // });

    // it('User2 unstakes max GBT', async function () {
    //     console.log("******************************************************");

    //     await XGBT.connect(user2).withdrawToken((await XGBT.balanceOf(user2.address)).sub(await GBT.mustStayGBT(user2.address)));

    // });

    // it('User2 repays max', async function () {
    //     console.log("******************************************************");

    //     await weth.connect(user2).approve(GBT.address, one);
    //     await GBT.connect(user2).repayMax();

    // });

    // it('User2 unstakes all GBT', async function () {
    //     console.log("******************************************************");

    //     await XGBT.connect(user2).withdrawToken(await XGBT.balanceOf(user2.address));

    // });

    // it('User2 stakes 2 GBT', async function () {
    //     console.log("******************************************************");

    //     await GBT.connect(user2).approve(XGBT.address, two);
    //     await XGBT.connect(user2).depositToken(two);

    // });

    // it('User1 Buys GBT with 50 WETH', async function () {
    //     console.log("******************************************************");

    //     await weth.connect(user1).approve(GBT.address, fifty);
    //     await GBT.connect(user1).buy(fifty, 1, 1682282187);

    // });

    // it('User1 sells rest of GBT', async function () {
    //     console.log("******************************************************");

    //     await GBT.connect(user1).approve(GBT.address, ten);
    //     await GBT.connect(user1).sell((await GBT.balanceOf(user1.address)).sub(two), 1, 1682282187);

    // });

    // it('User1 calls treasury skim', async function () {
    //     console.log("******************************************************");

    //     await GBT.connect(user1).treasurySkim();

    // });

    // it('Forward 3 days', async function () {
    //     console.log("******************************************************");

    //     await network.provider.send('evm_increaseTime', [3*24*3600]); 
    //     await network.provider.send('evm_mine');

    // });

    // it('User1 stakes 2 GBT', async function () {
    //     console.log("******************************************************");

    //     await GBT.connect(user1).approve(XGBT.address, two);
    //     await XGBT.connect(user1).depositToken(two);

    // });

    // it('Forward 4 days', async function () {
    //     console.log("******************************************************");

    //     await network.provider.send('evm_increaseTime', [4*24*3600]); 
    //     await network.provider.send('evm_mine');

    // });

    // it('Users claim rewards', async function () {
    //     console.log("******************************************************");

    //     await XGBT.connect(user1).getReward();
    //     await XGBT.connect(user2).getReward();
    //     await XGBT.connect(user3).getReward();

    // });

    // it('User1 Buys GBT with 50 WETH', async function () {
    //     console.log("******************************************************");

    //     await weth.connect(user1).approve(GBT.address, fifty);
    //     await GBT.connect(user1).buy(fifty, 1, 1682282187);

    // });

    // it('User1 swaps for exact 3 NFT', async function () {
    //     console.log("******************************************************");

    //     await GBT.connect(user1).approve(GNFT.address, three)
    //     let tokenID1 = await GNFT.gumballs(0);
    //     let tokenID2 = await GNFT.gumballs(1);
    //     let tokenID3 = await GNFT.gumballs(2);
    //     await GNFT.connect(user1).swapForExact([tokenID1, tokenID2, tokenID3]);

    // });

    // it('User1 sells rest of GBT', async function () {
    //     console.log("******************************************************");

    //     await GBT.connect(user1).approve(GBT.address, ten);
    //     await GBT.connect(user1).sell(await GBT.balanceOf(user1.address), 1, 1682282187);

    // });

    // it('User1 calls treasury skim', async function () {
    //     console.log("******************************************************");

    //     await GBT.connect(user1).treasurySkim();

    // });

    // it('Forward 3 days', async function () {
    //     console.log("******************************************************");

    //     await network.provider.send('evm_increaseTime', [3*24*3600]); 
    //     await network.provider.send('evm_mine');

    // });

    // it('User1 Buys GBT with 50 WETH', async function () {
    //     console.log("******************************************************");

    //     await weth.connect(user1).approve(GBT.address, ten);
    //     await GBT.connect(user1).buy(ten, 1, 1682282187);

    // });

    // it('User1 sells rest of GBT', async function () {
    //     console.log("******************************************************");

    //     await GBT.connect(user1).approve(GBT.address, ten);
    //     await GBT.connect(user1).sell(await GBT.balanceOf(user1.address), 1, 1682282187);

    // });

    // it('User1 calls treasury skim', async function () {
    //     console.log("******************************************************");

    //     await expect(GBT.connect(user1).treasurySkim()).to.be.revertedWith('reward amount should be greater than leftover amount');

    // });

    // it('User1 Buys GBT with 50 WETH', async function () {
    //     console.log("******************************************************");

    //     await weth.connect(user1).approve(GBT.address, fifty);
    //     await GBT.connect(user1).buy(fifty, 1, 1682282187);

    // });

    // it('User1 sells rest of GBT', async function () {
    //     console.log("******************************************************");

    //     await GBT.connect(user1).approve(GBT.address, fifty);
    //     await GBT.connect(user1).sell(await GBT.balanceOf(user1.address), 1, 1682282187);

    // });

    // it('User1 calls treasury skim', async function () {
    //     console.log("******************************************************");

    //     await GBT.connect(user1).treasurySkim();

    // });

    // it('Forward 3 days', async function () {
    //     console.log("******************************************************");

    //     await network.provider.send('evm_increaseTime', [3*24*3600]); 
    //     await network.provider.send('evm_mine');

    // });

    // it('User1 claim rewards', async function () {
    //     console.log("******************************************************");

    //     await XGBT.connect(user1).getReward();

    // });

    // it('Forward 4 days', async function () {
    //     console.log("******************************************************");

    //     await network.provider.send('evm_increaseTime', [3*24*3600]); 
    //     await network.provider.send('evm_mine');

    // });

    // it('Users claim rewards', async function () {
    //     console.log("******************************************************");

    //     await XGBT.connect(user1).getReward();
    //     await XGBT.connect(user2).getReward();
    //     await XGBT.connect(user3).getReward();

    // });

    // it('Owner sends USDC to gumbar', async function () {
    //     console.log("******************************************************");

    //     await USDC.connect(owner).transfer(XGBT.address, ten);
    //     await expect(XGBT.connect(owner).recoverERC20(USDC.address, ten)).to.be.reverted;
    //     await XGBT.connect(protocol).recoverERC20(USDC.address, ten);

    // });

    // it('Protocol transfers ownership to owner then transfer back', async function () {
    //     console.log("******************************************************");

    //     await XGBT.connect(protocol).nominateNewOwner(owner.address);
    //     await XGBT.connect(owner).acceptOwnership();

    //     await XGBT.connect(owner).nominateNewOwner(protocol.address);
    //     await XGBT.connect(protocol).acceptOwnership();

    // });

    // it('Gumball Coverage Testing', async function () {
    //     console.log("******************************************************");

    //     await GNFT.bFee();
    //     await GNFT.tokenContract();
    //     await GNFT.tokenBal();
    //     await GNFT.nftBal();
    //     await GNFT.contractURI();
    //     await GNFT.totalSupply();
    //     await GNFT.currentPrice();
    //     await GNFT.gumballs.length;

    // });

    // it('Gumbar Coverage Testing', async function () {
    //     console.log("******************************************************");

    //     await XGBT.stakingToken();
    //     await XGBT.stakingNFT();
    //     await XGBT.totalSupply();
    //     await XGBT.balanceOf(user1.address);
    //     await XGBT.lastTimeRewardApplicable(weth.address);
    //     await XGBT.rewardPerToken(weth.address);

    //     await XGBT.connect(protocol).setRewardsDistributor(weth.address, GBT.address);
    //     await XGBT.connect(protocol).setRewardsDistributor(GBT.address, GBT.address);
    //     await expect(XGBT.connect(protocol).recoverERC20(weth.address, one)).to.be.revertedWith("Cannot withdraw reward token");

    // });

    // it('Bonding Curve Coverage Testing', async function () {
    //     console.log("******************************************************");

    //     await GBT.BASE_TOKEN();
    //     await GBT.reserveVirtualBASE();
    //     await GBT.reserveRealBASE();
    //     await GBT.reserveGBT();
    //     await GBT.initial_totalSupply();
    //     await GBT.treasuryBASE();
    //     await GBT.treasuryGBT();
    //     await GBT.gumball();
    //     await GBT.gumbar();
    //     await GBT.artist();
    //     await GBT.protocol();
    //     await GBT.factory();

    //     await GBT.borrowedTotalBASE();
    //     await GBT.currentPrice();

    //     await GBT.borrowCredit(user1.address);
    //     await GBT.skimReward();
    //     await GBT.debt(user1.address);
    //     await GBT.baseBal();
    //     await GBT.gbtBal();
    //     await GBT.getProtocol();
    //     await GBT.getGumball();
    //     await GBT.initSupply();

    // });

    it('System Status', async function () {
        console.log("******************************************************");

        let reserveVirtualETH = await GBT.reserveVirtualBASE();
        let reserveRealETH = await GBT.reserveRealBASE();
        let balanceETH = await weth.balanceOf(GBT.address);
        let reserveGBT = await GBT.reserveGBT()
        let totalSupplyGBT = await GBT.totalSupply();
        let borrowedTotalETH = await GBT.borrowedTotalBASE();

        let gumbarGBT = await XGBT.totalSupply();
        let rFDGBT = await XGBT.getRewardForDuration(GBT.address);
        let rFDETH = await XGBT.getRewardForDuration(weth.address);

        let treasuryETH = await GBT.treasuryBASE();
        let treasuryGBT = await GBT.treasuryGBT();

        let artistGBT = await GBT.balanceOf(artist.address);
        let artistETH = await weth.balanceOf(artist.address);

        let protocolGBT = await GBT.balanceOf(protocol.address);
        let protocolETH = await weth.balanceOf(protocol.address);

        let user1ETH = await weth.balanceOf(user1.address);
        let user1GBT = await GBT.balanceOf(user1.address);
        let user1GNFT = await GNFT.balanceOf(user1.address);
        let user1XGBT = await XGBT.balanceOf(user1.address);
        let user1EarnedGBT = await XGBT.earned(user1.address, GBT.address);
        let user1EarnedETH = await XGBT.earned(user1.address, weth.address);
        let user1BorrowedETH = await GBT.borrowedBASE(user1.address);
        let user1MustStayGBT = await GBT.mustStayGBT(user1.address);

        let user2ETH = await weth.balanceOf(user2.address);
        let user2GBT = await GBT.balanceOf(user2.address);
        let user2GNFT = await GNFT.balanceOf(user2.address);
        let user2XGBT = await XGBT.balanceOf(user2.address);
        let user2EarnedGBT = await XGBT.earned(user2.address, GBT.address);
        let user2EarnedETH = await XGBT.earned(user2.address, weth.address);
        let user2BorrowedETH = await GBT.borrowedBASE(user2.address);
        let user2MustStayGBT = await GBT.mustStayGBT(user2.address);

        let user3ETH = await weth.balanceOf(user3.address);
        let user3GBT = await GBT.balanceOf(user3.address);
        let user3GNFT = await GNFT.balanceOf(user3.address);
        let user3XGBT = await XGBT.balanceOf(user3.address);
        let user3EarnedGBT = await XGBT.earned(user3.address, GBT.address);
        let user3EarnedETH = await XGBT.earned(user3.address, weth.address);
        let user3BorrowedETH = await GBT.borrowedBASE(user3.address);
        let user3MustStayGBT = await GBT.mustStayGBT(user3.address);

        // Invariants

        // for each user: mustStayGBT <= staked balance 
        // bonding curve balance ETH = rETH + bETH
        // GBT staked = sum of users staked balances

        console.log("BONDING CURVE RESERVES");
        console.log("GBT Reserve", divDec(reserveGBT));
        console.log("vETH Reserve", divDec(reserveVirtualETH));
        console.log("rETH Reserve", divDec(reserveRealETH));
        console.log("GBT Treasury", divDec(treasuryGBT));
        console.log("ETH Treasury", divDec(treasuryETH));
        console.log("ETH Borrowed", divDec(borrowedTotalETH));
        console.log("ETH Balance", divDec(balanceETH));
        console.log("GBT Total Supply", divDec(totalSupplyGBT));
        console.log();

        console.log("GUMBAR");
        console.log("GBT Staked", divDec(gumbarGBT));
        console.log("GBT reward for duration", divDec(rFDGBT));
        console.log("ETH reward for duration", divDec(rFDETH));
        console.log();

        console.log("Gumball Machine");
        for (let i = 0; i < await GNFT.gumballsLength(); i++) {
            console.log("Gumball", i, " ", await GNFT.gumballs(i));
        }
        console.log();

        console.log("ARTIST BALANCES");
        console.log("GBT", divDec(artistGBT));
        console.log("ETH", divDec(artistETH));
        console.log();

        console.log("PROTOCOL BALANCES");
        console.log("GBT", divDec(protocolGBT));
        console.log("ETH", divDec(protocolETH));
        console.log();

        console.log("USER1 BALANCES");
        console.log("ETH", divDec(user1ETH));
        console.log("GBT", divDec(user1GBT));
        console.log("GNFT", divDec(user1GNFT));
        console.log("Staked GBT", divDec(user1XGBT));
        console.log("Earned GBT", divDec(user1EarnedGBT));
        console.log("Earned ETH", divDec(user1EarnedETH));
        console.log("Borrowed ETH", divDec(user1BorrowedETH));
        console.log("Must Stay GBT", divDec(user1MustStayGBT));
        console.log();

        console.log("USER2 BALANCES");
        console.log("ETH", divDec(user2ETH));
        console.log("GBT", divDec(user2GBT));
        console.log("GNFT", divDec(user2GNFT));
        console.log("Staked GBT", divDec(user2XGBT));
        console.log("Earned GBT", divDec(user2EarnedGBT));
        console.log("Earned ETH", divDec(user2EarnedETH));
        console.log("Borrowed ETH", divDec(user2BorrowedETH));
        console.log("Must Stay GBT", divDec(user2MustStayGBT));
        console.log();

        console.log("USER3 BALANCES");
        console.log("ETH", divDec(user3ETH));
        console.log("GBT", divDec(user3GBT));
        console.log("GNFT", divDec(user3GNFT));
        console.log("Staked GBT", divDec(user3XGBT));
        console.log("Earned GBT", divDec(user3EarnedGBT));
        console.log("Earned ETH", divDec(user3EarnedETH));
        console.log("Borrowed ETH", divDec(user3BorrowedETH));
        console.log("Must Stay GBT", divDec(user3MustStayGBT));
        console.log();

    });

})