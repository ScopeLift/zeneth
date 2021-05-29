import { getAddress } from '@ethersproject/address';
import { arrayify, hexlify, splitSignature } from '@ethersproject/bytes';
import { Zero } from '@ethersproject/constants';
import { JsonRpcProvider, TransactionRequest, Web3Provider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { FlashbotsBundleProvider, FlashbotsOptions } from '@flashbots/ethers-provider-bundle';
import { TransactionFactory } from '@ethereumjs/tx';
import Common from '@ethereumjs/common';
import { TransactionFragment } from './types';

// Define constants
const GOERLI_RELAY_URL = 'https://relay-goerli.flashbots.net/';
export class ZenethRelayer {
  constructor(
    readonly provider: JsonRpcProvider,
    readonly flashbotsProvider: FlashbotsBundleProvider,
    readonly common: Common
  ) {}

  /**
   * @notice Returns a new ZenethRelayer instance
   */
  static async create(provider: JsonRpcProvider, authPrivateKey: string) {
    const chainId = (await provider.getNetwork()).chainId;

    // If the chainId is 1, set relayUrl to undefined so FlashbotsBundleProvider uses its `DEFAULT_FLASHBOTS_RELAY`
    // parameter for mainnet. If chainId is 5, use the current Goerli relayer. Otherwise, chainId is unsupported
    if (chainId !== 1 && chainId !== 5) throw new Error('Unsupported network');
    const relayUrl = chainId === 1 ? undefined : GOERLI_RELAY_URL;
    const common = new Common({ chain: chainId });
    const authSigner = new Wallet(authPrivateKey);

    // Return new ZenethRelayer instance
    const flashbotsProvider = await FlashbotsBundleProvider.create(provider, authSigner, relayUrl);
    return new ZenethRelayer(provider, flashbotsProvider, common);
  }

  /**
   * @notice Generates the transaction object to sign
   * @dev This function does not try to estimate gas usage because gas estimation will fail if you use a gas price
   * of zero, and we can't use a gas price of 1 wei because we assume the sender has no ETH, so gas estimation will
   * fail in that case too
   * @param tx A TransactionRequest that is not completed. Only from, to, and gasLimit are required
   */
  async populateTransaction(tx: TransactionRequest): Promise<TransactionRequest> {
    const { from, to, gasLimit } = tx;
    let { nonce } = tx;
    if (nonce === undefined) {
      if (!from) throw new Error("Must include either 'from' or 'nonce' field");
      nonce = await this.provider.getTransactionCount(from);
    }
    if (!to) throw new Error("Must include 'to' field");
    if (!gasLimit) throw new Error("Must include 'gasLimit' field");

    // Return transaction with chain ID and zero gas price
    return {
      chainId: this.provider.network.chainId,
      data: tx.data || '0x',
      gasLimit,
      gasPrice: '0x0',
      nonce,
      to: getAddress(to),
      value: tx.value || Zero,
    };
  }

  /**
   * @notice Populates multiple transactions that are ready to be signed
   * @dev Only for use case where all transactions are sent from the same user
   * @dev This handles nonces as well, and will start with the latest nonce found in the network
   * @param from The user sending the transactions
   * @param txs Array of objects containing the data, gasLimit, to, and value for each transaction
   */
  async populateTransactions(from: string, txs: TransactionFragment[]): Promise<TransactionRequest[]> {
    const initialNonce = await this.provider.getTransactionCount(from);
    console.log(initialNonce);
    const promises = txs.map((tx, index) => {
      return this.populateTransaction({
        data: tx.data,
        gasLimit: tx.gasLimit,
        nonce: initialNonce + index, // increment nonce for each transaction
        to: tx.to,
        value: tx.value,
      });
    });
    return Promise.all(promises);
  }

  /**
   * @notice Prompts the user to sign transactions use eth_sign
   * @dev We can't use eth_signTransaction because many wallets do not support it
   * @dev The user will receive one signature prompt for each transaction fragment
   * @param from The user sending the transactions
   * @param txs Array of objects containing the data, gasLimit, to, and value for each transaction
   */
  async signBundle(from: string, txs: TransactionFragment[], provider: Web3Provider) {
    // Get our transactions to sign
    const populatedTransactions = await this.populateTransactions(from, txs);

    // Prepare to sign
    // If ethers detects MetaMask, it will replace eth_sign with personal_sign. This is a problem because personal_sign
    // adds a message prefix, but eth_sign does not. This means personal_sign CANNOT be used to sign a transaction
    // manually (i.e. bypassing MetaMask's lack of support for eth_signTransaction), but eth_sign can. Because of this
    // security risk of eth_sign, which is deprecated, MetaMask doesn’t want you to use it. So if you are using MetaMask
    // and try to use eth_sign, ethers will change it to use personal_sign. Therefore, we ensure ethers cannot detect
    // that we are using MetaMask
    const isMetaMask = provider.provider.isMetaMask;
    if (isMetaMask) provider.provider.isMetaMask = false;

    // Prompt the user to sign each transaction
    const signedTransactions: string[] = [];
    for (const populatedTransaction of populatedTransactions) {
      const tx = TransactionFactory.fromTxData(populatedTransaction, { common: this.common });
      const unsignedTransaction = tx.getMessageToSign();
      const signature = await this.provider.send('eth_sign', [from, hexlify(unsignedTransaction)]);
      const splitSig = splitSignature(signature);
      // @ts-expect-error this is a private method and not part of the type definitions
      const txWithSig = tx._processSignature(splitSig.v, arrayify(splitSig.r), arrayify(splitSig.s));
      signedTransactions.push(hexlify(txWithSig.serialize()));
    }

    // Reset provider to it's original state and return the signed transactions
    provider.provider.isMetaMask = isMetaMask;
    return signedTransactions;
  }

  /**
   * @notice Adds auth key signature to bundle of transactions signed by user
   * @param txs Array of user-signed transactions to auth-sign
   * @returns Array of transactions signed by our auth key
   */
  async authSign(txs: string[]) {
    const flashbotsTxs = txs.map((tx) => ({ signedTransaction: tx }));
    return await this.flashbotsProvider.signBundle(flashbotsTxs);
  }

  /**
   * @notice Sends a flashbots bundle
   * @param txs Array of signed transactions to send
   * @param validBlocks Starting from the next block, how many total blocks are valid for mining the transactions. A
   * value of 1 means only the next block is valid, a value of 6 means the next 6 blocks are valid
   */
  async sendBundle(txs: string[], validBlocks: number, opts?: FlashbotsOptions) {
    if (validBlocks < 1) throw new Error(`Minimum 'validBlocks' value is 1, got ${validBlocks}`);

    // First we sign the bundle of transactions with our auth key
    const signedBundle = await this.authSign(txs);

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
