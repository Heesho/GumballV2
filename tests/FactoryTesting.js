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
let GBT1, XGBT1, GNFT1;

describe.only("System Testing", function () {
  
    before("Initial set up", async function () {
        console.log("Begin Initialization");

        // initialize users
        [owner, admin, user1, user2, user3, artist, protocol] = await ethers.getSigners();

        // initialize tokens
        // mints 1000 tokens to deployer
        const ETHContract = await ethers.getContractFactory("ERC20Mock");
        const ETH = await ETHContract.deploy("ETH", "ETH");
        const USDC = await ETHContract.deploy("USDC", "USDC");
        await ETH.deployed();
        console.log("- Tokens Initialized");

        // initialize ERC20BondingCurve

        const TokenLibrary = await ethers.getContractFactory("ERC20BondingCurveL");
        const tokenLibrary = await TokenLibrary.deploy();
        await tokenLibrary.deployed();
        console.log("- ERC20 Bonding Curve Library Initialized");

        // initialize Gumbar 

        const GUMBAR = await ethers.getContractFactory("GumbarL");
        const gumbar = await GUMBAR.deploy(owner.address, owner.address, owner.address, ETH.address);
        await gumbar.deployed();
        console.log("- Gumbar Library Initialized");

        // initialize Gumball

        const NFTLibrary = await ethers.getContractFactory('Gumball');
        const nftLibrary = await NFTLibrary.deploy();
        await nftLibrary.deployed();
        console.log("- Gumball Library Initialized");

        // initialize factory

        const Factory = await ethers.getContractFactory('Factory');
        const factory = await Factory.deploy(tokenLibrary.address, nftLibrary.address);
        await factory.deployed();
        console.log("- Factory Initialized");

        await factory.deployProxies('GBT1', 'GBT1', ['testuri', 'testURI'], '10000000000000000000000', '10000000000000000000000', ETH.address, owner.address, 0)
        
        // Attach contracts to first collection
        let array1 = await factory.deployInfo(0);
        GBT1 = tokenLibrary.attach(array1[0]);
        GNFT1 = nftLibrary.attach(array1[1]);
        XGBT1 = gumbar.attach(await GBT1.gumbar());
        console.log("- Collection1 Initialized");

        console.log("Initialization Complete");
        console.log("******************************************************");
    });

    it('System Status', async function () {
        console.log("******************************************************");
    });

})