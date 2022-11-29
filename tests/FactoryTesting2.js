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
let GBT, XGBT, GNFT, weth, factory, USDC;
let tokenLibrary, nftLibrary;

describe("Factory Testing", function () {
  
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

        // initialize ERC20BondingCurve

        const TokenLibrary = await ethers.getContractFactory("ERC20BondingCurveL");
        tokenLibrary = await TokenLibrary.deploy();
        await tokenLibrary.deployed();
        console.log("- ERC20 Bonding Curve Library Initialized");

        // initialize Gumbar 

        const GUMBAR = await ethers.getContractFactory("GumbarL");
        const gumbar = await GUMBAR.deploy(owner.address, owner.address, owner.address, weth.address);
        await gumbar.deployed();
        console.log("- Gumbar Library Initialized");

        // initialize Gumball

        const NFTLibrary = await ethers.getContractFactory('Gumball');
        nftLibrary = await NFTLibrary.deploy();
        await nftLibrary.deployed();
        console.log("- Gumball Library Initialized");

        // initialize factory

        const Factory = await ethers.getContractFactory('Factory');
        factory = await Factory.deploy(tokenLibrary.address, nftLibrary.address);
        await factory.deployed();
        console.log("- Factory Initialized");

        await factory.deployProxies('GBT1', 'GBT1', ['testuri', 'testURI'], '10000000000000000000000', '10000000000000000000000', weth.address, artist.address, 0);
        
        // Attach contracts to first collection
        let array1 = await factory.deployInfo(0);
        GBT = tokenLibrary.attach(array1[0]);
        GNFT = nftLibrary.attach(array1[1]);
        XGBT = gumbar.attach(await GBT.gumbar());
        console.log("- Collection1 Initialized");

        console.log("Initialization Complete");
        console.log("******************************************************");
    });

    it('User1 Buys GBT with 10 WETH', async function () {
        console.log("******************************************************");
        await weth.connect(user1).approve(GBT.address, ten);
        await GBT.connect(user1).buy(ten, 1, 1682282187);
    });

    it('User1 Sells GBT with 10 WETH', async function () {
        console.log("******************************************************");
        await GBT.connect(user1).approve(GBT.address, await GBT.balanceOf(user1.address));
        await GBT.connect(user1).sell(await GBT.balanceOf(user1.address), 1, 1682282187);
    });

    it('User1 Buys GBT with 10 WETH', async function () {
        console.log("******************************************************");
        await weth.connect(user1).approve(GBT.address, one);
        await GBT.connect(user1).buy(one, 1, 1682282187);
    });

    it('User1 stakes all GBT', async function () {
        console.log("******************************************************");

        await GBT.connect(user1).approve(XGBT.address, await GBT.balanceOf(user1.address));
        await XGBT.connect(user1).depositToken(await GBT.balanceOf(user1.address));

    });

    it('User1 calls treasury skim', async function () {
        console.log("******************************************************");

        await GBT.connect(user1).treasurySkim();

    });

    it('Forward 3 days', async function () {
        console.log("******************************************************");

        await network.provider.send('evm_increaseTime', [3*24*3600]); 
        await network.provider.send('evm_mine');

    });

    it('User1 unstakes all GBT', async function () {
        console.log("******************************************************");

        await XGBT.connect(user1).withdrawToken(await XGBT.balanceOf(user1.address));

    });

    it('Forward 3 days', async function () {
        console.log("******************************************************");

        await network.provider.send('evm_increaseTime', [3*24*3600]); 
        await network.provider.send('evm_mine');

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