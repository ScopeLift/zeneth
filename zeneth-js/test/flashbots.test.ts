import { expect } from 'chai';
import { BigNumber } from '@ethersproject/bignumber';
import { Zero, MaxUint256 } from '@ethersproject/constants';
import { Contract } from '@ethersproject/contracts';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { FlashbotsRelayer } from '../src/index';
import * as ERC20Abi from '../src/abi/ERC20.json';
import * as SwapBriberAbi from '../src/abi/SwapBriber.json';

// Verify environment variables
const infuraId = process.env.INFURA_ID;
if (!infuraId) throw new Error('Please set your INFURA_ID in the .env file');
const authPrivateKey = process.env.AUTH_PRIVATE_KEY;
if (!authPrivateKey) throw new Error('Please set your AUTH_PRIVATE_KEY in the .env file');

// Setup providers
const mainnetProviderUrl = `https://mainnet.infura.io/v3/${infuraId}`;
const mainnetProvider = new JsonRpcProvider(mainnetProviderUrl);
const goerliProviderUrl = `https://goerli.infura.io/v3/${infuraId}`;
const goerliProvider = new JsonRpcProvider(goerliProviderUrl);

// Uniswap addresses (on Goerli)
const uniRouterAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const wethAddress = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6';

// Get instance of Goerli DAI
const dai = new Contract('0xCdC50DB037373deaeBc004e7548FA233B3ABBa57', ERC20Abi, goerliProvider);

// Setup account of user that has no ETH. This is a random account that was given Goerli testnet tokens and no ETH
const user = new Wallet('0x6eea9d8bafc2440aa2fb29533f9139b2cce891c89d6088bc74517ea1fbbaf7df', goerliProvider); // address: 0x47550514d0Ed597413ae944e25A62B4bFE28aD55

// Setup account of relayer that will pay ETH
// const relayer = new Wallet('0x764508aa9a1c3b31e5e959468fa400ed34db678d0f5b94907fde260fede7e5dc', goerliProvider); // address: 0xe6AEd8FD1FBcb0868FFfFA9025607Ea020C2fA98

// Define address of our swapAndBribe contract
const swapAndBribe = new Contract('0x264063408fD1bdC703083AE083c813240A024B7f', SwapBriberAbi, goerliProvider);

// Define constants
const GOERLI_RELAY_URL = 'https://relay-goerli.flashbots.net/';

describe('Flashbots relayer', () => {
  describe('Initialization', () => {
    it('initializes a relayer instance with mainnet as the default', async () => {
      const flashbotsRelayer = await FlashbotsRelayer.create(mainnetProvider);
      expect(flashbotsRelayer.provider.connection.url).to.equal(mainnetProviderUrl);
      expect(flashbotsRelayer.flashbotsProvider.connection.url).to.equal('https://relay.flashbots.net');
    });

    it('initializes a relayer instance against a Goerli', async () => {
      const flashbotsRelayer = await FlashbotsRelayer.create(goerliProvider);
      expect(flashbotsRelayer.provider.connection.url).to.equal(goerliProviderUrl);
      expect(flashbotsRelayer.flashbotsProvider.connection.url).to.equal(GOERLI_RELAY_URL);
    });

    it('throws if initialized with an unsupported network', async () => {
      const rinkebyProviderUrl = `https://rinkeby.infura.io/v3/${infuraId}`;
      const rinkebyProvider = new JsonRpcProvider(rinkebyProviderUrl);
      expectRejection(FlashbotsRelayer.create(rinkebyProvider), 'Unsupported network');
    });
  });

  describe.only('Usages', () => {
    let flashbotsRelayer: FlashbotsRelayer;
    const transferAmount = 100n * 10n ** 18n; // 100 DAI
    const feeAmount = 25n * 10n ** 18n; // 25 DAI
    const bribeAmount = 1n * 10n ** 15n; // 0.001 ETH (must be less than feeAmount/ethPrice)
    let chainId: number;

    beforeEach(async () => {
      flashbotsRelayer = await FlashbotsRelayer.create(goerliProvider);
      ({ chainId } = await goerliProvider.getNetwork());
      expect(await goerliProvider.getBalance(user.address)).to.equal(0);
      expect(await dai.balanceOf(user.address)).to.be.above(0);
    });

    it('sends simple bundle where user sends tokens and relayer pays ETH', async () => {
      // Get nonce of the first transaction
      let nonce = await goerliProvider.getTransactionCount(user.address);

      // TRANSACTION 1
      // User signs transaction to send DAI to arbitrary recipient
      const recipient = Wallet.createRandom(); // random recipient simplifies testing since balance will be 0
      const transferData = dai.interface.encodeFunctionData('transfer', [recipient.address, transferAmount]);
      const tx1 = {
        chainId,
        data: transferData,
        from: user.address,
        gasLimit: BigNumber.from('250000'),
        gasPrice: Zero,
        nonce,
        to: dai.address,
        value: Zero,
      };
      const sig1 = await user.signTransaction(tx1);
      nonce += 1; // must track nonce manually

      // TRANSACTION 2
      // User signs transaction approving SwapBribe contract to spend their DAI
      const approveData = dai.interface.encodeFunctionData('approve', [swapAndBribe.address, MaxUint256]);
      const tx2 = {
        chainId,
        data: approveData,
        from: user.address,
        gasLimit: BigNumber.from('250000'),
        gasPrice: Zero,
        nonce,
        to: dai.address,
        value: Zero,
      };
      const sig2 = await user.signTransaction(tx2);
      nonce += 1;

      // TRANSACTION 3
      // User signs transaction approving SwapBribe contract to spend their DAI
      const swapAndBribeData = swapAndBribe.interface.encodeFunctionData('swapAndBribe', [
        dai.address,
        feeAmount,
        bribeAmount,
        uniRouterAddress,
        [dai.address, wethAddress], // swap path
        '2000000000', //deadline, very far into the future
      ]);
      const tx3 = {
        chainId,
        data: swapAndBribeData,
        from: user.address,
        gasLimit: BigNumber.from('1000000'),
        gasPrice: Zero,
        nonce,
        to: swapAndBribe.address,
        value: Zero,
      };
      const sig3 = await user.signTransaction(tx3);
      nonce += 1;

      // SEND BUNDLE
      const signedTxs = [sig1, sig2, sig3].map((sig) => ({ signedTransaction: sig }));
      const validBlocks = 5;
      const bundlePromises = await flashbotsRelayer.sendBundle(signedTxs, validBlocks);
      console.log('bundlePromises', bundlePromises);
    });

    it('does not send bundles with transactions that revert');
  });
});

/**
 * @notice Wrapper function to verify that an async function rejects with the specified message
 * @param promise Promise to wait for
 * @param message Expected rejection message
 */
export const expectRejection = async (promise: Promise<any>, message: string) => {
  // Error type requires strings, so we set them to an arbitrary value and
  // later check the values. If unchanged, the promise did not reject
  let error: Error = { name: 'default', message: 'default' };
  try {
    await promise;
  } catch (e) {
    error = e;
  } finally {
    expect(error.name).to.not.equal('default');
    expect(error.message).to.not.equal('default');
    expect(error.message).to.equal(message);
  }
};
