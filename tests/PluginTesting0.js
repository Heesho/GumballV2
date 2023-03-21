const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const divDec = (amount, decimals = 18) => amount/10**decimals;
const { inputToConfig } = require("@ethereum-waffle/compiler");
const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { execPath } = require("process");
const axios = require('axios');

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
const tenThousand = convert('10000', 18);
const April2026 = '1775068986';
const May2026 = '1776278586';
const oneWeek = 604800;
const oneday = 24*3600;
const twodays = 2*24*3600;
const spiritPerBlock = "10000000000000000000";
const startBlock = "1";
const startTime = Math.floor(Date.now() / 1000);

function timer(t){
    return new Promise(r=>setTimeout(r,t));
  }

const provider = new ethers.providers.getDefaultProvider('http://127.0.0.1:8545/');

// WETH
const weth_addr = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1';
const weth_url = 'https://api.arbiscan.io/api?module=contract&action=getabi&address=0x8b194bEae1d3e0788A1a35173978001ACDFba668&apikey=1Q5JCGEHYG63SWTARH96FPHIUZDGZE579T';

// PLS
const pls_addr = '0x51318B7D00db7ACc4026C88c3952B66278B6A67F';
const pls_url = 'https://api.arbiscan.io/api?module=contract&action=getabi&address=0x51318B7D00db7ACc4026C88c3952B66278B6A67F&apikey=1Q5JCGEHYG63SWTARH96FPHIUZDGZE579T';

// sGLP
const sglp_addr = '0x2F546AD4eDD93B956C8999Be404cdCAFde3E89AE';
const sglp_url = 'https://api.arbiscan.io/api?module=contract&action=getabi&address=0x2F546AD4eDD93B956C8999Be404cdCAFde3E89AE&apikey=1Q5JCGEHYG63SWTARH96FPHIUZDGZE579T';

// fsGLP
const fsglp_addr = '0x1aDDD80E6039594eE970E5872D247bf0414C8903';
const fsglp_url = 'https://api.arbiscan.io/api?module=contract&action=getabi&address=0x1aDDD80E6039594eE970E5872D247bf0414C8903&apikey=1Q5JCGEHYG63SWTARH96FPHIUZDGZE579T';

// plvGLP
const plv_glp_addr = '0x5326E71Ff593Ecc2CF7AcaE5Fe57582D6e74CFF1';
const plv_glp_url = 'https://api.arbiscan.io/api?module=contract&action=getabi&address=0x5326E71Ff593Ecc2CF7AcaE5Fe57582D6e74CFF1&apikey=1Q5JCGEHYG63SWTARH96FPHIUZDGZE579T';

// GLP Reward Router: WETH <-> GLP
const glp_rewarder_router_addr = '0xB95DB5B167D75e6d04227CfFFA61069348d271F5';
const glp_rewarder_router_url = 'https://api.arbiscan.io/api?module=contract&action=getabi&address=0xB95DB5B167D75e6d04227CfFFA61069348d271F5&apikey=1Q5JCGEHYG63SWTARH96FPHIUZDGZE579T';

const glp_manager = '0x3963FfC9dff443c2A94f21b129D429891E32ec18';

// plvGLPDepositor: GLP <-> plvGLP
const plv_glp_depositor_addr = '0x13F0D29b5B83654A200E4540066713d50547606E';
const plv_glp_depositor_url = 'https://api.arbiscan.io/api?module=contract&action=getabi&address=0x13F0D29b5B83654A200E4540066713d50547606E&apikey=1Q5JCGEHYG63SWTARH96FPHIUZDGZE579T';

// plvGLPFarm: plvGLP <-> farm
const plv_glp_farm_addr = '0x4E5Cf54FdE5E1237e80E87fcbA555d829e1307CE';
const plv_glp_farm_url = 'https://api.arbiscan.io/api?module=contract&action=getabi&address=0x4E5Cf54FdE5E1237e80E87fcbA555d829e1307CE&apikey=1Q5JCGEHYG63SWTARH96FPHIUZDGZE579T';

// Plutus Whitelsit
const whitelist_addr = '0x97247DE3fe7c5aA718b2be4d454E42de11eAfc6d';
const whitelist_url = 'https://api.arbiscan.io/api?module=contract&action=getabi&address=0x97247DE3fe7c5aA718b2be4d454E42de11eAfc6d&apikey=1Q5JCGEHYG63SWTARH96FPHIUZDGZE579T';

const whitelist_owner = '0xa5c1c5a67ba16430547fea9d608ef81119be1876';

let response;
let owner, artist, protocol, user1, user2, user3;
let gbtFactory, xgbtFactory, gnftFactory, factory;
let GBT, GNFT, XGBT, GBTFees;
let weth, PLS, sGLP, fsGLP, plvGLP, gumiGLP;
let glp_reward_router, plv_glp_depositor, plv_glp_farm, whitelist;

describe.only("PluginTesting0", function () {
  
    before("Initial set up", async function () {
        console.log("Begin Initialization");

        // initialize users
        [owner, protocol, artist, user1, user2, user3] = await ethers.getSigners();

        // Wrapped ETH
        response = await axios.get(weth_url);
        const weth_abi = JSON.parse(response.data.result);
        weth = new ethers.Contract(weth_addr, weth_abi, provider);
        await timer(1000);

        // PLS
        response = await axios.get(pls_url);
        const pls_abi = JSON.parse(response.data.result);
        PLS = new ethers.Contract(pls_addr, pls_abi, provider);
        await timer(1000);

        // sGLP
        response = await axios.get(sglp_url);
        const sglp_abi = JSON.parse(response.data.result);
        sGLP = new ethers.Contract(sglp_addr, sglp_abi, provider);
        await timer(1000);

        // fsGLP
        response = await axios.get(fsglp_url);
        const fsglp_abi = JSON.parse(response.data.result);
        fsGLP = new ethers.Contract(fsglp_addr, fsglp_abi, provider);
        await timer(1000);

        // plvGLP
        response = await axios.get(plv_glp_url);
        const plv_glp_abi = JSON.parse(response.data.result);
        plvGLP = new ethers.Contract(plv_glp_addr, plv_glp_abi, provider);
        await timer(1000);

        // GLP Reward Router V2
        response = await axios.get(glp_rewarder_router_url);
        const glp_rewarder_router_abi = JSON.parse(response.data.result);
        glp_reward_router = new ethers.Contract(glp_rewarder_router_addr, glp_rewarder_router_abi, provider);
        await timer(1000);

        // plvGLP Depositor
        response = await axios.get(plv_glp_depositor_url);
        const plv_glp_depositor_abi = JSON.parse(response.data.result);
        plv_glp_depositor = new ethers.Contract(plv_glp_depositor_addr, plv_glp_depositor_abi, provider);
        await timer(1000);

        // plvGLP Farm
        response = await axios.get(plv_glp_farm_url);
        const plv_glp_farm_abi = JSON.parse(response.data.result);
        plv_glp_farm = new ethers.Contract(plv_glp_farm_addr, plv_glp_farm_abi, provider);
        await timer(1000);

        // Plutus Whitelist
        response = await axios.get(whitelist_url);
        const whitelist_abi = JSON.parse(response.data.result);
        whitelist = new ethers.Contract(whitelist_addr, whitelist_abi, provider);
        await timer(1000);
        console.log("- External contracts attached");

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

        // Gumi GLP
        const GumiGLP = await ethers.getContractFactory("contracts/plugins/Gumi_plvGLP.sol:Gumi_plvGLP");
        gumiGLP = await GumiGLP.deploy(factory.address);
        await gumiGLP.deployed();
        console.log("- GumiGLP Deployed");

        // Impersonate whitelist owner and whitelist gumiGLP contract
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [whitelist_owner],
        });
        const whitelistOwner = await ethers.getSigner(whitelist_owner);
        await whitelist.connect(whitelistOwner).whitelistAdd(gumiGLP.address);
        await plv_glp_farm.connect(whitelistOwner).setWhitelist(whitelist.address);
        console.log("- gumiGLP whitelisted on plutus depositor and farm");

        await factory.connect(owner).deployGumBall('GBT', 'GBT', ['testuri', 'testURI'], oneHundred, oneHundred, gumiGLP.address, artist.address, 0, [50, 50]);
        console.log("- GumBall Collection Deployed");

        let GumBallData = await factory.connect(user1).deployInfo(0);
        GBT = await ethers.getContractAt("contracts/GBTFactory.sol:GBT", GumBallData[0]);
        GNFT = await ethers.getContractAt("contracts/GNFTFactory.sol:GNFT", GumBallData[1]);
        XGBT = await ethers.getContractAt("contracts/XGBTFactory.sol:XGBT", GumBallData[2]);
        GBTFees = await ethers.getContractAt("contracts/GBTFactory.sol:GBTFees", await GBT.getFees());

        await gumiGLP.connect(owner).setXGBT(XGBT.address);
        await factory.connect(owner).addReward(XGBT.address, PLS.address);
        console.log("- PLS added as reward in staking contract");

        console.log("Initialization Complete");
    });

    it('user1 wraps ETH', async function () {
        console.log("******************************************************");
        await weth.connect(user1).deposit({value: ethers.utils.parseEther("10.0")});
    });

    it('user1 converts WETH to GLP', async function () {
        console.log("******************************************************");
        await weth.connect(user1).approve(glp_manager, one);
        await glp_reward_router.connect(user1).mintAndStakeGlp(weth.address, one, 0, 1);
    });

    it('user1 converts GLP to plvGLP', async function () {
        console.log("******************************************************");
        let balFSGLP = fsGLP.connect(user1).balanceOf(user1.address);
        await sGLP.connect(user1).approve(plv_glp_depositor.address, balFSGLP);
        await plv_glp_depositor.connect(user1).deposit(balFSGLP);
    });

    it('user1 converts plvGLP to gumiGLP', async function () {
        console.log("******************************************************");
        let balPLVGLP = plvGLP.connect(user1).balanceOf(user1.address);
        await plvGLP.connect(user1).approve(gumiGLP.address, balPLVGLP);
        await gumiGLP.connect(user1).depositFor(user1.address, balPLVGLP);
    });

    it('System Status', async function () {
        console.log("******************************************************");

        let wethuser1 = await weth.connect(user1).balanceOf(user1.address);
        let gumiglpuser1 = await gumiGLP.connect(user1).balanceOf(user1.address);
        let plsuser1 = await PLS.connect(user1).balanceOf(user1.address);
        let fsglpuser1 = await fsGLP.connect(user1).balanceOf(user1.address);
        let plvglpuser1 = await plvGLP.connect(user1).balanceOf(user1.address);

        console.log("USER1", user1.address);
        console.log('WETH', divDec(wethuser1));
        console.log('gumiGLP', divDec(gumiglpuser1));
        console.log('PLS', divDec(plsuser1));
        console.log('fsGLP', divDec(fsglpuser1));
        console.log('plvGLP', divDec(plvglpuser1));
        console.log();

    });



  
})