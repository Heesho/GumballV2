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