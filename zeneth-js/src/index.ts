import { resolve } from 'path';
import { config as dotenvConfig } from 'dotenv';
import { Wallet } from '@ethersproject/wallet';
import { JsonRpcProvider } from '@ethersproject/providers';
import { FlashbotsBundleProvider, FlashbotsOptions } from '@flashbots/ethers-provider-bundle';
import { FlashbotsTransaction } from './types';

dotenvConfig({ path: resolve(__dirname, '../../.env') });

// Verify environment variables
const authPrivateKey = process.env.AUTH_PRIVATE_KEY;
if (!authPrivateKey) throw new Error('Please set your AUTH_PRIVATE_KEY in the .env file');

// Get auth signer
const authSigner = new Wallet(authPrivateKey);

// Define constants
const GOERLI_RELAY_URL = 'https://relay-goerli.flashbots.net/';

export class ZenethRelayer {
  constructor(readonly provider: JsonRpcProvider, readonly flashbotsProvider: FlashbotsBundleProvider) {}

  /**
   * @notice Returns a new ZenethRelayer instance
   */
  static async create(provider: JsonRpcProvider) {
    const chainId = (await provider.getNetwork()).chainId;

    // If the chainId is 1, set relayUrl to undefined so FlashbotsBundleProvider uses its `DEFAULT_FLASHBOTS_RELAY`
    // parameter for mainnet. If chainId is 5, use the current Goerli relayer. Otherwise, chainId is unsupported
    if (chainId !== 1 && chainId !== 5) throw new Error('Unsupported network');
    const relayUrl = chainId === 1 ? undefined : GOERLI_RELAY_URL;

    // Return new ZenethRelayer instance
    const flashbotsProvider = await FlashbotsBundleProvider.create(provider, authSigner, relayUrl);
    return new ZenethRelayer(provider, flashbotsProvider);
  }

  /**
   * @notice Sends a flashbots bundle
   * @param txs Array of flashbots transactions to send
   * @param validBlocks Starting from the next block, how many total blocks are valid for mining the transactions. A
   * value of 1 means only the next block is valid, a value of 6 means the next 6 blocks are valid
   */
  async sendBundle(txs: FlashbotsTransaction[], validBlocks: number, opts?: FlashbotsOptions) {
    if (validBlocks < 1) throw new Error(`Minimum 'validBlocks' value is 1, got ${validBlocks}`);

    // First we sign the bundle of transactions with our auth key
    const signedBundle = await this.flashbotsProvider.signBundle(txs);

    // Next we define the targetBlockNumbers, which are "The only block number for which the bundle is to be considered
    // valid. If you would like more than one block to be targeted, submit multiple rpc calls targeting each specific
    // block. This value should be higher than the value of getBlockNumber(). Submitting a bundle with a target block
    // number of the current block, or earlier, is a no-op". we use this to generate an array of:
    //   `[currentBlockNumber + 1, ..., currentBlockNumber + 1 + validBlocks]`
    const currentBlockNumber = await this.provider.getBlockNumber();
    const targetBlocks = getIncrementingArray(validBlocks, currentBlockNumber + 1);

    // Simulate the bundle in the next block
    const simulation = await this.flashbotsProvider.simulate(signedBundle, targetBlocks[0]);

    // Check for errors in the simulation
    if ('error' in simulation || simulation.firstRevert !== undefined || JSON.stringify(simulation).includes('error')) {
      console.log('simulation:', simulation);
      throw new Error('Simulation error occurred, exiting. See simulation object for more details');
    }

    // No errors simulating, so send the bundle
    return targetBlocks.map((block) => this.flashbotsProvider.sendRawBundle(signedBundle, block, opts));
  }
}

// ==================== Helper methods ====================

// Generates an array of length `length` starting with value `startValue` with each element incremented by 1
const getIncrementingArray = (length: number, startValue: number) => {
  // Create empty array of length `length` and get the keys of that array
  const keys = Array(length).keys(); // e.g. if length is 3 this is [0, 1, 2]
  // `Array.from(x, mapFunction)` creates an array from array `x` but maps the values according to `mapFunction`.
  // So we map element `i` in the array to block number to `i + startValue`
  return Array.from(keys, (x) => x + startValue);
};
