import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'solidity-coverage';

import './tasks/accounts';
import './tasks/clean';

import { resolve } from 'path';

import { config as dotenvConfig } from 'dotenv';
import { HardhatUserConfig } from 'hardhat/config';
import { NetworkUserConfig } from 'hardhat/types';

dotenvConfig({ path: resolve(__dirname, '../.env') });

const chainIds = {
  ganache: 1337,
  goerli: 5,
  hardhat: 31337,
  kovan: 42,
  mainnet: 1,
  rinkeby: 4,
  ropsten: 3,
};

const mnemonic = 'test test test test test test test test test test test junk';

// Ensure that we have all the environment variables we need.
const infuraApiKey = process.env.INFURA_ID as string;
if (!infuraApiKey) throw new Error('Please set your INFURA_ID in a .env file');

function createTestnetConfig(network: keyof typeof chainIds): NetworkUserConfig {
  const url: string = `https://${network}.infura.io/v3/${infuraApiKey}`;
  return {
    accounts: {
      count: 10,
      initialIndex: 0,
      mnemonic,
      path: "m/44'/60'/0'/0",
    },
    chainId: chainIds[network],
    url,
  };
}

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  gasReporter: {
    currency: 'USD',
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
    src: './contracts',
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic,
      },
      chainId: chainIds.hardhat,
    },
    goerli: createTestnetConfig('goerli'),
    kovan: createTestnetConfig('kovan'),
    rinkeby: createTestnetConfig('rinkeby'),
    ropsten: createTestnetConfig('ropsten'),
  },
  paths: {
    artifacts: './artifacts',
    cache: './cache',
    sources: './contracts',
    tests: './test',
  },
  solidity: {
    version: '0.8.3',
    settings: {
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/solidity-template/issues/31
        bytecodeHash: 'none',
      },
      // You should disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 800,
      },
    },
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },
  mocha: {
    // Default timeout of tx.wait() in the ethers-provider-flashbots-bundle package is 5 minutes, as linked below,
    // so we use a 6 minute test timeout
    // https://github.com/flashbots/ethers-provider-flashbots-bundle/blob/18894d683c1c282536a108ce64b7178a22a05c7e/src/index.ts#L105
    timeout: 6 * 60 * 1000,
  },
};

export default config;
