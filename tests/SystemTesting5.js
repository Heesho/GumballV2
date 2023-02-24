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
let owner, admin, user1, user2, user3, artist, protocol;
let weth, USDC;
let gbtFactory, gnftFactory, xgbtFactory, factory;
let GBT, GNFT, XGBT, GBTFees;

describe("SystemTesting5", function () {
  
    before("Initial set up", async function () {
        console.log("Begin Initialization");

        // initialize users
        [owner, admin, user1, user2, user3, artist, protocol] = await ethers.getSigners();

        // initialize tokens
        // mints 1000 tokens to deployer
        const ETHContract = await ethers.getContractFactory("ERC20Mock");
        weth = await ETHContract.deploy("ETH", "ETH");
        USDC = await ETHContract.deploy("ETH", "ETH");
        await weth.deployed();
        await weth.mint(user1.address, oneThousand);
        await weth.mint(user2.address, oneThousand);
        await weth.mint(user3.address, oneThousand);
        console.log("- Tokens Initialized");

        const GBTFactory = await ethers.getContractFactory("GBTFactory");
        gbtFactory = await GBTFactory.deploy();
        await gbtFactory.deployed();
        console.log("- GBTFactory Initialized");

        const GNFTFactory = await ethers.getContractFactory("GNFTFactory");
        gnftFactory = await GNFTFactory.deploy();
        await gnftFactory.deployed();
        console.log("- GNFTFactory Initialized");

        const XGBTFactory = await ethers.getContractFactory("XGBTFactory");
        xgbtFactory = await XGBTFactory.deploy();
        await xgbtFactory.deployed();
        console.log("- XGBTFactory Initialized");

        const GumBallFactory = await ethers.getContractFactory("GumBallFactory");
        factory = await GumBallFactory.deploy(gbtFactory.address, gnftFactory.address, xgbtFactory.address, protocol.address);
        await factory.deployed();
        console.log("- GumBallFactory Initialized");

        await gbtFactory.connect(owner).setFactory(factory.address);
        await gnftFactory.connect(owner).setFactory(factory.address);
        await xgbtFactory.connect(owner).setFactory(factory.address);

        await factory.deployGumBall('GBT1', 'GBT1', ['testuri', 'testURI'], oneHundred, oneHundred, weth.address, artist.address, 0, [33, 50]);
        let GumBallData = await factory.deployInfo(0);
        GBT = await ethers.getContractAt("contracts/GBTFactory.sol:GBT", GumBallData[0]);
        GNFT = await ethers.getContractAt("contracts/GNFTFactory.sol:GNFT", GumBallData[1]);
        XGBT = await ethers.getContractAt("contracts/XGBTFactory.sol:XGBT", GumBallData[2]);
        GBTFees = await ethers.getContractAt("contracts/GBTFactory.sol:GBTFees", await GBT.getFees());
        console.log("- GumBall Initialized");

        console.log("Initialization Complete");
        console.log("******************************************************");
    });

    it('User1 Buys GBT with 50 WETH', async function () {
        console.log("******************************************************");

        await weth.connect(user1).approve(GBT.address, fifty);
        await GBT.connect(user1).buy(fifty, 1, 1682282187, AddressZero);

    });

    it('User1 sells rest of GBT', async function () {
        console.log("******************************************************");

        await GBT.connect(user1).approve(GBT.address, await GBT.balanceOf(user1.address));
        await GBT.connect(user1).sell(await GBT.balanceOf(user1.address), 1, 1682282187);

    });

    it('User1 Buys GBT with 10 WETH', async function () {
        console.log("******************************************************");

        await weth.connect(user1).approve(GBT.address, ten);
        await GBT.connect(user1).buy(ten, 1, 1682282187, AddressZero);

    });

    it('User1 stakes all GBT', async function () {
        console.log("******************************************************");

        await GBT.connect(user1).approve(XGBT.address, await GBT.balanceOf(user1.address));
        await XGBT.connect(user1).depositToken(await GBT.balanceOf(user1.address));

    });

    it('User2 calls treasury skim', async function () {
        console.log("******************************************************");

        await GBTFees.connect(user2).distributeFees();

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
        await GBT.connect(user1).buy(ten, 1, 1682282187, AddressZero);

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

        await GBTFees.connect(user2).distributeFees();

    });

    it('User1 Buys GBT with 10 WETH', async function () {
        console.log("******************************************************");

        await weth.connect(user1).approve(GBT.address, ten);
        await GBT.connect(user1).buy(ten, 1, 1682282187, AddressZero);

    });

    it('System Status', async function () {
        console.log("******************************************************");

        let reserveVirtualETH = await GBT.reserveVirtualBASE();
        let reserveRealETH = await GBT.reserveRealBASE();
        let balanceETH = await weth.balanceOf(GBT.address);
        let balanceGBT = await GBT.balanceOf(GBT.address);
        let reserveGBT = await GBT.reserveGBT()
        let totalSupplyGBT = await GBT.totalSupply();
        let borrowedTotalETH = await GBT.borrowedTotalBASE();

        let gumbarGBT = await XGBT.totalSupply();
        let rFDGBT = await XGBT.getRewardForDuration(GBT.address);
        let rFDETH = await XGBT.getRewardForDuration(weth.address);

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

        console.log("BONDING CURVE RESERVES");
        console.log("GBT Reserve", divDec(reserveGBT));
        console.log("vETH Reserve", divDec(reserveVirtualETH));
        console.log("rETH Reserve", divDec(reserveRealETH));
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

        // invariants
        await expect(reserveGBT).to.be.equal(balanceGBT);
        await expect(reserveRealETH.sub(borrowedTotalETH)).to.be.equal(balanceETH);

    });

})