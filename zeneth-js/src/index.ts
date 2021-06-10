import { getAddress } from '@ethersproject/address';
import { arrayify, hexlify, splitSignature } from '@ethersproject/bytes';
import { Zero } from '@ethersproject/constants';
import { JsonRpcProvider, TransactionRequest, Web3Provider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { FlashbotsBundleProvider, FlashbotsOptions } from '@flashbots/ethers-provider-bundle';
import { TransactionFactory } from '@ethereumjs/tx';
import Common from '@ethereumjs/common';
import { TransactionFragment } from './types';
import { mainnetRelayUrl, goerliRelayUrl } from './constants';
import { getGasPrice, getTokenAndEthPriceInUSD } from './helpers';

export class ZenethRelayer {
  constructor(
    readonly provider: JsonRpcProvider,
    readonly flashbotsProvider: FlashbotsBundleProvider,
    readonly common: Common
  ) {}

  /**
   * @notice Returns a new ZenethRelayer instance
   * @param provider ethers JsonRpcProvider instance
   * @param authPrivateKey Private key to use for signing flashbots bundles (this private key does not need to hold
   * funds, as it's strictly used for signing)
   * @returns ZenethRelayer instance
   */
  static async create(provider: JsonRpcProvider, authPrivateKey: string) {
    // Set relayerUrl accordingly based on chain ID
    const { chainId } = await provider.getNetwork();
    if (chainId !== 1 && chainId !== 5) throw new Error('Unsupported network');
    const relayUrl = chainId === 1 ? mainnetRelayUrl : goerliRelayUrl;
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
   * @notice Sends a flashbots bundle
   * @param txs Array of signed transactions to send
   * @param blockNumber A single block number for which this bundle is valid. Recommend using a block number 2 blocks
   * ahead of the last seen block number to account for propagation time
   * @param opts Options to specify when sending bundle, see the @flashbots/ethers-provider-bundle's `FlashbotsOptions`
   * type for more information
   * @returns Promise which resolves to type `FlashbotsTransaction`. This may resolve to either:
   *   1. `RelayResponseError`, which looks like `error: { message: string; code: number; };`
   *   2. `FlashbotsTransactionResponse` which contains 4 properties:
   *          1. `bundleTransactions` returns an array of the transactions included in the bundle
   *          2. `wait()` is a Promise which resolves to 0 if your bundle was included, 1 if your bundle was not
   *              included, or 2 if the nonce was too high (e.g. bundle was previously included, or account sent
   *              another transaction before the bundle was mined)
   *          3. `simulate()` is a Promise that resolves to the result of the bundle simulation
   *          4. `receipts()` is a Promise that resolves to an array of transaction receipts for each transaction in
   *             the bundle
   */
  async sendBundle(txs: string[], blockNumber: number, opts?: FlashbotsOptions) {
    // First we sign the bundle of transactions with our auth key
    const flashbotsTxs = txs.map((tx) => ({ signedTransaction: tx }));
    const signedBundle = await this.flashbotsProvider.signBundle(flashbotsTxs);

    // Simulate the bundle to ensure it does not revert
    const simulation = await this.flashbotsProvider.simulate(signedBundle, blockNumber);

    // Check for errors in the simulation
    if ('error' in simulation || simulation.firstRevert !== undefined || JSON.stringify(simulation).includes('error')) {
      console.log('simulation:', simulation);
      throw new Error('Simulation error occurred, exiting. Please make sure you are sending a valid bundle');
    }

    // No errors simulating, so send the bundle
    return this.flashbotsProvider.sendRawBundle(signedBundle, blockNumber, opts);
  }

  /**
   * @notice Estimates the fee (in base token units) for a bundle
   * @param token Token in which fee will be expressed as units of
   * @param transferUpperBound Given upper bound gas fee (in Gwei) for transfer
   * @param approveUpperBound Given upper bound gas fee (in Gwei) for approve
   * @param swapUpperBound Given upper bound gas fee (in Gwei) for swap
   * @param flashbotsAdjustment Multiplier for flashbots bribing miner.
   *
   * @returns Estimated fee for miner in token base units
   */
  async estimateFee(
    token: string,
    transferUpperBound: number,
    approveUpperBound: number,
    swapUpperBound: number,
    flashbotsAdjustment: number
  ): Promise<number> {
    // get current gas price
    const gasPriceInWei = await getGasPrice();
    const { tokenPrice, ethPrice } = await getTokenAndEthPriceInUSD(token);

    const bundleGasUsed = transferUpperBound + approveUpperBound + swapUpperBound;
    const initiallyCalculatedFee = bundleGasUsed * gasPriceInWei;
    const bundleGasEtimateinWei = initiallyCalculatedFee * flashbotsAdjustment;
    const amountOfEthUsedInGas = bundleGasEtimateinWei / 1e18;
    const dollarsNeededForBribe = amountOfEthUsedInGas / ethPrice;
    const tokensNeededForBribe = dollarsNeededForBribe * tokenPrice;

    console.log(`token: ${token}`);
    console.log(`gas price in wei: ${gasPriceInWei}`);
    console.log(`token price and eth price: ${tokenPrice}, ${ethPrice}`);
    console.log(`Bundle gas used is: ${bundleGasUsed}`);
    console.log(`Initially Estimated fee in Wei is: ${initiallyCalculatedFee}`);
    console.log(`Estimated fee in Wei (after flashbots adjustment): ${bundleGasEtimateinWei}`);
    console.log(`Amount of Eth used in Gas: ${amountOfEthUsedInGas}`);
    console.log(`Amount of dollars needed for bribe: ${dollarsNeededForBribe}`);
    console.log(`Amount of tokens needed for bribe: ${tokensNeededForBribe}`);

    return bundleGasEtimateinWei;
  }
}
