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

export class FlashbotsRelayer {
  constructor(readonly provider: JsonRpcProvider, readonly flashbotsProvider: FlashbotsBundleProvider) {}

  /**
   * @notice Returns a new FlashbotsRelayer instance
   */
  static async create(provider: JsonRpcProvider) {
    const flashbotsProvider = await FlashbotsBundleProvider.create(provider, authSigner);
    return new FlashbotsRelayer(provider, flashbotsProvider);
  }

  /**
   * @notice Sends a flashbots bundle
   * @param txs Array of flashbots transactions to send
   * @param validBlocks Starting from the next block, how many total blocks are valid for mining the transactions. A
   * value of 1 means only the next block is valid, a value of 6 means the next 6 blocks are valid
   */
  async sendBundle(txs: FlashbotsTransaction[], validBlocks: number, opts?: FlashbotsOptions) {
    if (validBlocks < 1) throw new Error(`Minimum 'validBlocks' value is 1, got ${validBlocks}`);
    // First we define the targetBlockNumber, which is "The only block number for which the bundle is to be considered
    // valid. If you would like more than one block to be targeted, submit multiple rpc calls targeting each specific
    // block. This value should be higher than the value of getBlockNumber(). Submitting a bundle with a target block
    // number of the current block, or earlier, is a no-op."
    const currentBlockNumber = await this.provider.getBlockNumber();

    // Generate array of [currentBlockNumber+1, ..., currentBlockNumber + 1 + validBlocks]
    const targetBlocks = Array.from(Array(validBlocks).keys(), (x) => x + 1 + currentBlockNumber);

    // Simulate the bundle
    const simulation = await this.flashbotsProvider.simulate([], targetBlocks[0]);
    if ('error' in simulation || simulation.firstRevert !== undefined) {
      console.log('Simulation error occurred, exiting.');
      return;
    }

    // Send the bundle
    const bundlePromises = targetBlocks.map((blockNumber) => this.flashbotsProvider.sendBundle(txs, blockNumber, opts));
    console.log('bundlePromises: ', bundlePromises);
  }
}
