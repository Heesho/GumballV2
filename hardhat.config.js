require("@nomiclabs/hardhat-waffle");
require("solidity-coverage");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

module.exports = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: {
          yul: true
        }
      },
    },
  },
  networks: {
    hardhat: {    
      chainId: 42161,
      forking: {
        url: 'https://arb-mainnet.g.alchemy.com/v2/rb1F4XDQBoyhozMVO3U3n_LyHBbwA1tu',
        blockNumber: 68640000,
      }
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