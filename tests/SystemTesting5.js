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
let owner, admin, user1, user2, user3, gumbar, artist, protocol, gumball;
let weth, GBT, XGBT, GNFT, USDC;

describe("System Testing 5", function () {
  
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

    it('User1 Buys GBT with 50 WETH', async function () {
        console.log("******************************************************");

        await weth.connect(user1).approve(GBT.address, fifty);
        await GBT.connect(user1).buy(fifty, 1, 1682282187);

    });

    it('User1 sells rest of GBT', async function () {
        console.log("******************************************************");

        await GBT.connect(user1).approve(GBT.address, await GBT.balanceOf(user1.address));
        await GBT.connect(user1).sell(await GBT.balanceOf(user1.address), 1, 1682282187);

    });

    it('User1 Buys GBT with 10 WETH', async function () {
        console.log("******************************************************");

        await weth.connect(user1).approve(GBT.address, ten);
        await GBT.connect(user1).buy(ten, 1, 1682282187);

    });

    it('User1 stakes all GBT', async function () {
        console.log("******************************************************");

        await GBT.connect(user1).approve(XGBT.address, await GBT.balanceOf(user1.address));
        await XGBT.connect(user1).depositToken(await GBT.balanceOf(user1.address));

    });

    it('User2 calls treasury skim', async function () {
        console.log("******************************************************");

        await GBT.connect(user2).treasurySkim();

    });

    it('Forward 7 days', async function () {
        console.log("******************************************************");

        await network.provider.send('evm_increaseTime', [7*24*3600]); 
        await network.provider.send('evm_mine');

    });

    it('User1 claims rewards', async function () {
        console.log("******************************************************");

        await XGBT.connect(user1).getReward();

    });

    it('Forward 1 days', async function () {
        console.log("******************************************************");

        await network.provider.send('evm_increaseTime', [24*3600]); 
        await network.provider.send('evm_mine');

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

        await GBT.connect(user1).approve(GBT.address, await GBT.balanceOf(user1.address));
        await GBT.connect(user1).sell(await GBT.balanceOf(user1.address), 1, 1682282187);

    });

    it('User1 converts NFT to GBT', async function () {
        console.log("******************************************************");

        let tokenID = await GNFT.tokenOfOwnerByIndex(user1.address, 0);
        await GNFT.connect(user1).approve(GNFT.address, tokenID);
        await GNFT.connect(user1).redeem([tokenID]);

    });

    it('User2 calls treasury skim', async function () {
        console.log("******************************************************");

        await GBT.connect(user2).treasurySkim();

    });

    // it('Forward 7 days', async function () {
    //     console.log("******************************************************");

    //     await network.provider.send('evm_increaseTime', [7*24*3600]); 
    //     await network.provider.send('evm_mine');

    // });

    it('User1 Buys GBT with 10 WETH', async function () {
        console.log("******************************************************");

        await weth.connect(user1).approve(GBT.address, ten);
        await GBT.connect(user1).buy(ten, 1, 1682282187);

    });

    it('System Status', async function () {
        console.log("******************************************************");

        let reserveVirtualETH = await GBT.reserveVirtualBASE();
        let reserveRealETH = await GBT.reserveRealBASE();
        let balanceETH = await weth.balanceOf(GBT.address);
        let reserveGBT = await GBT.reserveGBT()
        let balanceGBT = await GBT.balanceOf(GBT.address);
        let totalSupplyGBT = await GBT.totalSupply();
        let borrowedTotalETH = await GBT.borrowedTotalBASE();

        let gumbarGBT = await GBT.balanceOf(XGBT.address);
        let gumbarStakedGBT = await XGBT.totalSupply();
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

        // invariants
        await expect(reserveGBT.add(treasuryGBT)).to.be.equal(balanceGBT);
        await expect(reserveRealETH.add(treasuryETH).sub(borrowedTotalETH)).to.be.equal(balanceETH);

        console.log("BONDING CURVE RESERVES");
        console.log("GBT Reserve", divDec(reserveGBT));
        console.log("vETH Reserve", divDec(reserveVirtualETH));
        console.log("rETH Reserve", divDec(reserveRealETH));
        console.log("GBT Treasury", divDec(treasuryGBT));
        console.log("ETH Treasury", divDec(treasuryETH));
        console.log("ETH Borrowed", divDec(borrowedTotalETH));
        console.log("ETH Balance", divDec(balanceETH));
        console.log("GBT Balance", divDec(balanceGBT));
        console.log("GBT Total Supply", divDec(totalSupplyGBT));
        console.log();

        console.log("GUMBAR");
        console.log("GBT", divDec(gumbarGBT));
        console.log("GBT Staked", divDec(gumbarStakedGBT));
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