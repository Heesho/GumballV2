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

// users
let owner, admin, user1, user2, user3, gumbar, artist, protocol, gumball, retail, rewarder;
let weth, GBT, XGBT, GNFT, USDC;

describe("Retail Testing", function () {
  
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

        const RetailArtifact = await ethers.getContractFactory("Retail");
        const RetailContract = await RetailArtifact.deploy(artist.address, GBT.address, XGBT.address, GNFT.address);
        retail = await ethers.getContractAt("Retail", RetailContract.address);

        const RewarderArtifact = await ethers.getContractFactory("RetailRewarder");
        const RewarderContract = await RewarderArtifact.deploy(artist.address, retail.address);
        rewarder = await ethers.getContractAt("RetailRewarder", RewarderContract.address);

        await retail.connect(artist).setRetailRewarder(rewarder.address);
        await rewarder.connect(artist).addReward(GBT.address, retail.address);
        await rewarder.connect(artist).addReward(weth.address, retail.address);
        
        console.log("Initialization Complete");
        console.log("******************************************************");
    });

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

    it('User1 sells rest of GBT', async function () {
        console.log("******************************************************");

        await GBT.connect(user1).approve(GBT.address, ten);
        await GBT.connect(user1).sell(await GBT.balanceOf(user1.address), 1, 1682282187);

    });

    it('User1 redeems 1 gNFT to Retail', async function () {
        console.log("******************************************************");

        let tokenID1 = await GNFT.tokenOfOwnerByIndex(user1.address, 0);
        await GNFT.connect(user1).approve(retail.address, tokenID1);
        await retail.connect(user1).redeem(tokenID1);

    });

    it('User3 Buys GBT with 100 WETH', async function () {
        console.log("******************************************************");

        await weth.connect(user3).approve(GBT.address, oneHundred);
        await GBT.connect(user3).buy(oneHundred, 1, 1682282187);

    });

    it('User3 sells rest of GBT', async function () {
        console.log("******************************************************");

        await GBT.connect(user3).approve(GBT.address, oneHundred);
        await GBT.connect(user3).sell(await GBT.balanceOf(user3.address), 1, 1682282187);

    });

    it('User3 calls skim treasury on bonding curve', async function () {
        console.log("******************************************************");

        await GBT.connect(user3).treasurySkim();

    });

    it('User1 calls claim to rewarder on retail', async function () {
        console.log("******************************************************");

        await retail.connect(user1).claimFeesToRewarder();

    });

    it('User1 calls collect on retail', async function () {
        console.log("******************************************************");

        await retail.collect();

    });

    it('User1 claims retail rewards', async function () {
        console.log("******************************************************");

        await rewarder.connect(user1).getReward();

    });

    it('Forward 3 days', async function () {
        console.log("******************************************************");

        await network.provider.send('evm_increaseTime', [3*24*3600]); 
        await network.provider.send('evm_mine');

    });

    it('User1 calls claim to rewarder on retail', async function () {
        console.log("******************************************************");

        await retail.connect(user1).claimFeesToRewarder();

    });

    it('User2 Buys GBT with 10 WETH', async function () {
        console.log("******************************************************");

        await weth.connect(user2).approve(GBT.address, ten);
        await GBT.connect(user2).buy(ten, 1, 1682282187);

    });

    it('User2 converts 1 GBT to 1 gNFT', async function () {
        console.log("******************************************************");

        await GBT.connect(user2).approve(GNFT.address, one);
        await GNFT.connect(user2).swap(one);

    });

    it('User2 sells rest of GBT', async function () {
        console.log("******************************************************");

        await GBT.connect(user2).approve(GBT.address, ten);
        await GBT.connect(user2).sell(await GBT.balanceOf(user2.address), 1, 1682282187);

    });

    it('User2 redeems 1 gNFT to Retail', async function () {
        console.log("******************************************************");

        let tokenID1 = await GNFT.tokenOfOwnerByIndex(user2.address, 0);
        await GNFT.connect(user2).approve(retail.address, tokenID1);
        await retail.connect(user2).redeem(tokenID1);

    });

    it('User2 Buys GBT with 10 WETH', async function () {
        console.log("******************************************************");

        await weth.connect(user2).approve(GBT.address, ten);
        await GBT.connect(user2).buy(ten, 1, 1682282187);

    });

    it('User2 converts 2 GBT to 2 gNFT', async function () {
        console.log("******************************************************");

        await GBT.connect(user2).approve(GNFT.address, three);
        await GNFT.connect(user2).swap(three);

    });

    it('User2 sells rest of GBT', async function () {
        console.log("******************************************************");

        await GBT.connect(user2).approve(GBT.address, ten);
        await GBT.connect(user2).sell(await GBT.balanceOf(user2.address), 1, 1682282187);

    });

    it('User2 redeems 3 gNFT to Retail', async function () {
        console.log("******************************************************");

        let tokenID1 = await GNFT.tokenOfOwnerByIndex(user2.address, 0);
        let tokenID2 = await GNFT.tokenOfOwnerByIndex(user2.address, 1);
        let tokenID3 = await GNFT.tokenOfOwnerByIndex(user2.address, 2);
        await GNFT.connect(user2).approve(retail.address, tokenID1);
        await GNFT.connect(user2).approve(retail.address, tokenID2);
        await GNFT.connect(user2).approve(retail.address, tokenID3);
        await retail.connect(user2).redeem(tokenID1);
        await retail.connect(user2).redeem(tokenID2);
        await retail.connect(user2).redeem(tokenID3);

    });

    it('User3 Buys GBT with 100 WETH', async function () {
        console.log("******************************************************");

        await weth.connect(user3).approve(GBT.address, oneHundred);
        await GBT.connect(user3).buy(oneHundred, 1, 1682282187);

    });

    it('User3 sells rest of GBT', async function () {
        console.log("******************************************************");

        await GBT.connect(user3).approve(GBT.address, oneHundred);
        await GBT.connect(user3).sell(await GBT.balanceOf(user3.address), 1, 1682282187);

    });

    it('User3 calls skim treasury on bonding curve', async function () {
        console.log("******************************************************");

        await GBT.connect(user3).treasurySkim();

    });

    it('Forward 1 day', async function () {
        console.log("******************************************************");

        await network.provider.send('evm_increaseTime', [24*3600]); 
        await network.provider.send('evm_mine');

    });

    it('User1 calls claim to rewarder on retail', async function () {
        console.log("******************************************************");

        await retail.connect(user1).claimFeesToRewarder();

    });

    it('User1 claims retail rewards', async function () {
        console.log("******************************************************");

        await rewarder.connect(user1).getReward();

    });

    it('Forward 1 day', async function () {
        console.log("******************************************************");

        await network.provider.send('evm_increaseTime', [24*3600]); 
        await network.provider.send('evm_mine');

    });

    it('User1 calls claim to rewarder on retail', async function () {
        console.log("******************************************************");

        await retail.connect(user1).claimFeesToRewarder();

    });

    it('User1 and User2 claims retail rewards', async function () {
        console.log("******************************************************");

        await rewarder.connect(user1).getReward();
        await rewarder.connect(user2).getReward();

    });

    it('User1 sells rest of GBT', async function () {
        console.log("******************************************************");

        await GBT.connect(user1).approve(GBT.address, oneHundred);
        await GBT.connect(user1).sell(await GBT.balanceOf(user1.address), 1, 1682282187);

    });

    it('User2 sells rest of GBT', async function () {
        console.log("******************************************************");

        await GBT.connect(user2).approve(GBT.address, oneHundred);
        await GBT.connect(user2).sell(await GBT.balanceOf(user2.address), 1, 1682282187);

    });

    it('User3 Buys GBT with 100 WETH', async function () {
        console.log("******************************************************");

        await weth.connect(user3).approve(GBT.address, oneHundred);
        await GBT.connect(user3).buy(oneHundred, 1, 1682282187);

    });

    it('User3 sells rest of GBT', async function () {
        console.log("******************************************************");

        await GBT.connect(user3).approve(GBT.address, oneHundred);
        await GBT.connect(user3).sell(await GBT.balanceOf(user3.address), 1, 1682282187);

    });

    it('Forward 2 days', async function () {
        console.log("******************************************************");

        await network.provider.send('evm_increaseTime', [2*24*3600]); 
        await network.provider.send('evm_mine');

    });

    it('User3 calls skim treasury on bonding curve', async function () {
        console.log("******************************************************");

        await GBT.connect(user3).treasurySkim();

    });

    it('User1 calls claim to rewarder on retail', async function () {
        console.log("******************************************************");

        await retail.connect(user1).claimFeesToRewarder();

    });

    it('User3 Buys GBT with 100 WETH', async function () {
        console.log("******************************************************");

        await weth.connect(user3).approve(GBT.address, oneHundred);
        await GBT.connect(user3).buy(oneHundred, 1, 1682282187);

    });

    it('User3 converts 5 GBT to 5 gNFT', async function () {
        console.log("******************************************************");

        await GBT.connect(user3).approve(GNFT.address, five);
        await GNFT.connect(user3).swap(five);

    });

    it('User3 redeems 1 gNFT', async function () {
        console.log("******************************************************");

        let tokenID = await GNFT.tokenOfOwnerByIndex(user3.address, 0);
        await GNFT.connect(user3).approve(GNFT.address, tokenID);
        await GNFT.connect(user3).redeem([tokenID]);

    });

    it('User3 stakes 2 GBT', async function () {
        console.log("******************************************************");

        await GBT.connect(user3).approve(XGBT.address, two);
        await XGBT.connect(user3).depositToken(two);

    });

    it('User3 sells rest of GBT', async function () {
        console.log("******************************************************");

        await GBT.connect(user3).approve(GBT.address, oneHundred);
        await GBT.connect(user3).sell(await GBT.balanceOf(user3.address), 1, 1682282187);

    });

    it('User3 borrows max ETH', async function () {
        console.log("******************************************************");

        await GBT.connect(user3).borrowMax();

    });

    it('User3 stakes 2 NFT', async function () {
        console.log("******************************************************");

        let tokenID1 = await GNFT.tokenOfOwnerByIndex(user3.address, 0);
        let tokenID2 = await GNFT.tokenOfOwnerByIndex(user3.address, 1);
        await GNFT.connect(user3).approve(XGBT.address, tokenID1);
        await GNFT.connect(user3).approve(XGBT.address, tokenID2);
        await XGBT.connect(user3).depositNFT([tokenID1, tokenID2]);
    });

    it('User3 redeems 2 gNFT', async function () {
        console.log("******************************************************");

        let tokenID1 = await GNFT.tokenOfOwnerByIndex(user3.address, 0);
        let tokenID2 = await GNFT.tokenOfOwnerByIndex(user3.address, 1);
        await GNFT.connect(user3).approve(GNFT.address, tokenID1);
        await GNFT.connect(user3).approve(GNFT.address, tokenID2);
        await GNFT.connect(user3).redeem([tokenID1, tokenID2]);

    });

    it('User3 stakes 2 GBT', async function () {
        console.log("******************************************************");

        await GBT.connect(user3).approve(XGBT.address, oneHundred);
        await XGBT.connect(user3).depositToken(await GBT.balanceOf(user3.address));

    });

    it('User3 borrows max ETH', async function () {
        console.log("******************************************************");

        await GBT.connect(user3).borrowMax();

    });

    it('User3 sells rest of GBT', async function () {
        console.log("******************************************************");

        await GBT.connect(user3).approve(GBT.address, oneHundred);
        await expect(GBT.connect(user3).sell(await GBT.balanceOf(user3.address), 1, 1682282187)).to.be.revertedWith("Less than Min");
        await expect(GBT.connect(user3).sell(0, 1, 1682282187)).to.be.revertedWith("Less than Min");
        await expect(GBT.connect(user3).buy(0, 1, 1682282187)).to.be.revertedWith("Less than Min");

    });

    it('Forward 6 days', async function () {
        console.log("******************************************************");

        await network.provider.send('evm_increaseTime', [6*24*3600]); 
        await network.provider.send('evm_mine');

    });

    it('User3 calls skim treasury on bonding curve', async function () {
        console.log("******************************************************");

        await GBT.connect(user3).treasurySkim();
        await expect(GBT.connect(user3).treasurySkim()).to.be.reverted;

    });

    it('User1 calls claim to rewarder on retail', async function () {
        console.log("******************************************************");

        await retail.connect(user1).claimFeesToRewarder();

    });

    it('User3 Buys GBT with 100 WETH', async function () {
        console.log("******************************************************");

        await weth.connect(user3).approve(GBT.address, oneHundred);
        await GBT.connect(user3).buy(oneHundred, 1, 1682282187);

    });

    it('User3 sells rest of GBT', async function () {
        console.log("******************************************************");

        await GBT.connect(user3).approve(GBT.address, oneHundred);
        await GBT.connect(user3).sell(await GBT.balanceOf(user3.address), 1, 1682282187);

    });

    it('Forward 6 days', async function () {
        console.log("******************************************************");

        await network.provider.send('evm_increaseTime', [6*24*3600]); 
        await network.provider.send('evm_mine');

    });

    it('User3 calls skim treasury on bonding curve', async function () {
        console.log("******************************************************");

        await GBT.connect(user3).treasurySkim();

    });

    it('User1 calls claim to rewarder on retail', async function () {
        console.log("******************************************************");

        await retail.connect(user1).claimFeesToRewarder();

    });

    it('User1 and User2 claims retail rewards', async function () {
        console.log("******************************************************");

        await rewarder.connect(user1).getReward();
        await rewarder.connect(user2).getReward();

    });

    it('User3 repays loan', async function () {
        console.log("******************************************************");

        await weth.connect(user3).approve(GBT.address, oneHundred);
        await GBT.connect(user3).repayMax();

    });

    it('User3 unstakes 3 NFT', async function () {
        console.log("******************************************************");

        let tokenID1 = await XGBT.balanceNFT(user3.address, 0);
        let tokenID2 = await XGBT.balanceNFT(user3.address, 1);
        await XGBT.connect(user3).withdrawNFT([tokenID1, tokenID2]);

    });

    it('User3 redeems 2 gNFT to Retail', async function () {
        console.log("******************************************************");

        let tokenID1 = await GNFT.tokenOfOwnerByIndex(user3.address, 0);
        let tokenID2 = await GNFT.tokenOfOwnerByIndex(user3.address, 1);
        await GNFT.connect(user3).approve(retail.address, tokenID1);
        await GNFT.connect(user3).approve(retail.address, tokenID2);
        await retail.connect(user3).redeem(tokenID1);
        await retail.connect(user3).redeem(tokenID2);

    });

    it('User3 Buys GBT with 100 WETH', async function () {
        console.log("******************************************************");

        await weth.connect(user3).approve(GBT.address, oneHundred);
        await GBT.connect(user3).buy(oneHundred, 1, 1682282187);

    });

    it('User3 sells rest of GBT', async function () {
        console.log("******************************************************");

        await GBT.connect(user3).approve(GBT.address, oneHundred);
        await GBT.connect(user3).sell(await GBT.balanceOf(user3.address), 1, 1682282187);

    });

    it('Forward 7 days', async function () {
        console.log("******************************************************");

        await network.provider.send('evm_increaseTime', [7*24*3600]); 
        await network.provider.send('evm_mine');

    });

    it('User3 calls skim treasury on bonding curve', async function () {
        console.log("******************************************************");

        await GBT.connect(user3).treasurySkim();

    });

    it('User1 calls collect on retail', async function () {
        console.log("******************************************************");

        await retail.collect();

    });

    it('User1 calls claim to rewarder on retail', async function () {
        console.log("******************************************************");

        await retail.connect(user1).claimFeesToRewarder();

    });

    it('Forward 1 day', async function () {
        console.log("******************************************************");

        await network.provider.send('evm_increaseTime', [1*24*3600]); 
        await network.provider.send('evm_mine');

    });

    it('User1 calls claim to rewarder on retail', async function () {
        console.log("******************************************************");

        await retail.connect(user1).claimFeesToRewarder();

    });

    it('User1 claims retail rewards', async function () {
        console.log("******************************************************");

        await rewarder.connect(user1).getReward();


    });

    it('User1 and User2 and User3 claims retail rewards', async function () {
        console.log("******************************************************");

        await rewarder.connect(user1).getReward();
        await rewarder.connect(user2).getReward();
        await rewarder.connect(user3).getReward();

    });

    it('User1 and User2 and User3 claims retail rewards', async function () {
        console.log("******************************************************");

        await rewarder.connect(user1).getReward();
        await rewarder.connect(user2).getReward();
        await rewarder.connect(user3).getReward();

    });

    it('User3 Buys GBT with 100 WETH', async function () {
        console.log("******************************************************");

        await weth.connect(user3).approve(GBT.address, oneHundred);
        await GBT.connect(user3).buy(oneHundred, 1, 1682282187);

    });

    it('User1 sells rest of GBT', async function () {
        console.log("******************************************************");

        await GBT.connect(user1).approve(GBT.address, oneHundred);
        await GBT.connect(user1).sell(await GBT.balanceOf(user1.address), 1, 1682282187);

    });

    it('User2 sells rest of GBT', async function () {
        console.log("******************************************************");

        await GBT.connect(user2).approve(GBT.address, oneHundred);
        await GBT.connect(user2).sell(await GBT.balanceOf(user2.address), 1, 1682282187);

    });

    it('User3 sells rest of GBT', async function () {
        console.log("******************************************************");

        await GBT.connect(user3).approve(GBT.address, oneHundred);
        await GBT.connect(user3).sell(await GBT.balanceOf(user3.address), 1, 1682282187);

    });

    it('User3 calls skim treasury on bonding curve', async function () {
        console.log("******************************************************");

        await GBT.connect(user3).treasurySkim();

    });

    it('User1 calls claim to rewarder on retail', async function () {
        console.log("******************************************************");

        await retail.connect(user1).claimFeesToRewarder();

    });

    it('User1 calls collect on retail', async function () {
        console.log("******************************************************");

        await retail.collect();

    });

    it('User1 and User2 and User3 claims retail rewards', async function () {
        console.log("******************************************************");

        await rewarder.connect(user1).getReward();
        await rewarder.connect(user2).getReward();
        await rewarder.connect(user3).getReward();

    });

    it('Artist transfers ownership to owner then transfer back', async function () {
        console.log("******************************************************");

        await retail.connect(artist).nominateNewOwner(owner.address);
        await retail.connect(owner).acceptOwnership();

        await retail.connect(owner).nominateNewOwner(artist.address);
        await retail.connect(artist).acceptOwnership();

    });

    it('Artist transfers ownership to owner then transfer back', async function () {
        console.log("******************************************************");

        await rewarder.connect(artist).nominateNewOwner(owner.address);
        await rewarder.connect(owner).acceptOwnership();

        await rewarder.connect(owner).nominateNewOwner(artist.address);
        await rewarder.connect(artist).acceptOwnership();

    });

    it('Rewarder coverage', async function () {
        console.log("******************************************************");

        await rewarder.balanceOf(user1.address);
        await rewarder.connect(artist).setRewardsDistributor(GBT.address, retail.address);

    });



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

        let retailGBT = await GBT.balanceOf(retail.address);
        let retailETH = await weth.balanceOf(retail.address);
        let retailXGBT = await XGBT.balanceOf(retail.address);
        let retailBorrowedETH = await GBT.borrowedBASE(retail.address);
        let retailMustStayGBT = await GBT.mustStayGBT(retail.address);
        let retailNFT = await rewarder.totalSupply();
        let retailRDGBT = await rewarder.getRewardForDuration(GBT.address);
        let retailRDETH = await rewarder.getRewardForDuration(weth.address);

        let user1ETH = await weth.balanceOf(user1.address);
        let user1GBT = await GBT.balanceOf(user1.address);
        let user1GNFT = await GNFT.balanceOf(user1.address);
        let user1XGBT = await XGBT.balanceOf(user1.address);
        let user1EarnedGBT = await XGBT.earned(user1.address, GBT.address);
        let user1EarnedETH = await XGBT.earned(user1.address, weth.address);
        let user1BorrowedETH = await GBT.borrowedBASE(user1.address);
        let user1MustStayGBT = await GBT.mustStayGBT(user1.address);
        let user1Redeemed = await retail.balanceOf(user1.address);

        let user2ETH = await weth.balanceOf(user2.address);
        let user2GBT = await GBT.balanceOf(user2.address);
        let user2GNFT = await GNFT.balanceOf(user2.address);
        let user2XGBT = await XGBT.balanceOf(user2.address);
        let user2EarnedGBT = await XGBT.earned(user2.address, GBT.address);
        let user2EarnedETH = await XGBT.earned(user2.address, weth.address);
        let user2BorrowedETH = await GBT.borrowedBASE(user2.address);
        let user2MustStayGBT = await GBT.mustStayGBT(user2.address);
        let user2Redeemed = await retail.balanceOf(user2.address);

        let user3ETH = await weth.balanceOf(user3.address);
        let user3GBT = await GBT.balanceOf(user3.address);
        let user3GNFT = await GNFT.balanceOf(user3.address);
        let user3XGBT = await XGBT.balanceOf(user3.address);
        let user3EarnedGBT = await XGBT.earned(user3.address, GBT.address);
        let user3EarnedETH = await XGBT.earned(user3.address, weth.address);
        let user3BorrowedETH = await GBT.borrowedBASE(user3.address);
        let user3MustStayGBT = await GBT.mustStayGBT(user3.address);
        let user3Redeemed = await retail.balanceOf(user3.address);

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

        console.log("RETAIL BALANCES");
        console.log("GBT", divDec(retailGBT));
        console.log("ETH", divDec(retailETH));
        console.log("Staked GBT", divDec(retailXGBT));
        console.log("Borrowed ETH", divDec(retailBorrowedETH));
        console.log("Must Stay GBT", divDec(retailMustStayGBT));
        console.log("NFT Redeemed", divDec(retailNFT));
        console.log("GBT reward for duration", divDec(retailRDGBT));
        console.log("ETH reward for duration", divDec(retailRDETH));
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
        console.log("NFT Redeemed", divDec(user1Redeemed));
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
        console.log("NFT Redeemed", divDec(user2Redeemed));
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
        console.log("NFT Redeemed", divDec(user3Redeemed));
        console.log();

    });

})