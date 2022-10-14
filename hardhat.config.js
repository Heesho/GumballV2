require("@nomiclabs/hardhat-waffle");
require('solidity-coverage')

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.6.12'
      },
      {
        version: '0.8.0'
      },
      {
        version: '0.8.4'
      },
      {
        version: '0.8.11'
      }
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
    overrides: {
      "contracts/ERC20BondingCurve.sol": {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        }
      },
      "contracts/ERC20BondingCurveL.sol": {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        }
      },
      "contracts/Factory.sol": {
        version: "0.8.11",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        }
      },
    }
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    hardhat: {      
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./tests",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 300000,
  },
};