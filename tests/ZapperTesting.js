const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const divDec = (amount, decimals = 18) => amount/10**decimals;
const { inputToConfig } = require("@ethereum-waffle/compiler");
const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { execPath } = require("process");

const AddressZero = '0x0000000000000000000000000000000000000000'
const MINIMUM_LIQUIDITY = "1000"
const zero = convert('0', 18);
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
let owner, admin, user1, user2, user3, artist, protocol, gumball;
let GBT, XGBT, GNFT, weth, USDC, zapper, factory;
let tokenLibrary, nftLibrary;

describe.only("Zapper Testing", function () {

    before("Initial set up", async function () {
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
 
         await factory.deployProxies('GBT1', 'GBT1', ['testuri', 'testURI'], '10000000000000000000000', '10000000000000000000000', weth.address, owner.address, 0)
         
         // Attach contracts to first collection
         let array1 = await factory.deployInfo(0);
         GBT = tokenLibrary.attach(array1[0]);
         GNFT = nftLibrary.attach(array1[1]);
         XGBT = gumbar.attach(await GBT.gumbar());
         console.log("- Collection1 Initialized");

        //initialize zapper

        const Zapper = await ethers.getContractFactory('GumballZapper');
        zapper = await Zapper.deploy(factory.address, weth.address);
        await zapper.deployed();

        console.log("- Zapper Initialized");
        
        console.log("Initialization Complete");
        console.log("******************************************************");
    });

    it('User1 Buys NFT with 10 WETH', async function () {
        console.log("******************************************************");

        await weth.connect(user1).approve(zapper.address, five);
        let vas = await weth.connect(user1).allowance(user1.address, zapper.address);
        console.log(divDec(vas));
        await zapper.zapEthIn([[factory.gumballsDeployed(0), one, zero, [], false]]);
    });

    it('System Status', async function () {
        console.log("******************************************************");

        let user1ETH = await weth.balanceOf(user1.address);
        let user1GBT = await GBT.balanceOf(user1.address);
        let user1GNFT = await GNFT.balanceOf(user1.address);
        let user1XGBT = await XGBT.balanceOf(user1.address);
        let user1EarnedGBT = await XGBT.earned(user1.address, GBT.address);
        let user1EarnedETH = await XGBT.earned(user1.address, weth.address);
        let user1BorrowedETH = await GBT.borrowedBASE(user1.address);
        let user1MustStayGBT = await GBT.mustStayGBT(user1.address);

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

    });
})