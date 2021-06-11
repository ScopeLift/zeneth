import { expect } from 'chai';
//import * as sinon from 'sinon';
import { BigNumber } from '@ethersproject/bignumber';
import { Zero, MaxUint256 } from '@ethersproject/constants';
import { Contract } from '@ethersproject/contracts';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { ZenethRelayer } from '../src/index';
import * as ERC20Abi from '../src/abi/ERC20.json';
import * as SwapBriberAbi from '../src/abi/SwapBriber.json';
import { mainnetRelayUrl, goerliRelayUrl } from '../src/constants';

// @ts-ignore This is not under the workspace rootDir, but that's fine
import * as DeployInfo from '../../contracts/deploy-history/goerli-latest.json';

//import * as helpers from '../src/helpers'

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

// Uniswap V2 addresses (on Goerli)
const uniRouterAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const wethAddress = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6';

// @ts-ignore This is not under the workspace rootDir, but that's fine
import * as zenethSupportedTokens from '../../frontend/src/data/tokenlist.json';

// Get instance of Goerli DAI
const dai = new Contract('0xCdC50DB037373deaeBc004e7548FA233B3ABBa57', ERC20Abi, goerliProvider);

// Setup account of user that has no ETH. This is a random account that was given Goerli testnet tokens and no ETH
const user = new Wallet('0x6eea9d8bafc2440aa2fb29533f9139b2cce891c89d6088bc74517ea1fbbaf7df', goerliProvider); // address: 0x47550514d0Ed597413ae944e25A62B4bFE28aD55

// Define Goerli address of our swapAndBribe contract
const swapAndBribe = new Contract(DeployInfo.contracts.SwapBriber, SwapBriberAbi, goerliProvider);

describe('Flashbots relayer', () => {
  describe('Initialization', () => {
    it('initializes a relayer instance with mainnet as the default', async () => {
      const zenethRelayer = await ZenethRelayer.create(mainnetProvider, process.env.AUTH_PRIVATE_KEY as string);
      expect(zenethRelayer.provider.connection.url).to.equal(mainnetProviderUrl);
      expect(zenethRelayer.flashbotsProvider.connection.url).to.equal(mainnetRelayUrl);
    });

    it('initializes a relayer instance against a Goerli', async () => {
      const zenethRelayer = await ZenethRelayer.create(goerliProvider, process.env.AUTH_PRIVATE_KEY as string);
      expect(zenethRelayer.provider.connection.url).to.equal(goerliProviderUrl);
      expect(zenethRelayer.flashbotsProvider.connection.url).to.equal(goerliRelayUrl);
    });

    it('throws if initialized with an unsupported network', async () => {
      const rinkebyProviderUrl = `https://rinkeby.infura.io/v3/${infuraId}`;
      const rinkebyProvider = new JsonRpcProvider(rinkebyProviderUrl);
      await expectRejection(
        ZenethRelayer.create(rinkebyProvider, process.env.AUTH_PRIVATE_KEY as string),
        'Unsupported network'
      );
    });
  });

  describe('Usage', () => {
    let zenethRelayer: ZenethRelayer;
    const transferAmount = 100n * 10n ** 18n; // 100 DAI
    const feeAmount = 25n * 10n ** 18n; // 25 DAI
    const bribeAmount = 1n * 10n ** 15n; // 0.001 ETH (must be less than feeAmount/ethPrice)
    let chainId: number;

    beforeEach(async () => {
      zenethRelayer = await ZenethRelayer.create(goerliProvider, process.env.AUTH_PRIVATE_KEY as string);
      ({ chainId } = await goerliProvider.getNetwork());

      // Verify user has no ETH
      expect(await goerliProvider.getBalance(user.address)).to.equal(0);

      // Verify user has sufficient DAI balance before each test
      const minBalance = transferAmount + feeAmount;
      const userBalance = await dai.balanceOf(user.address);
      expect(userBalance.gt(minBalance), 'Please mint more Goerli DAI to the user to continue with testing').to.be.true;
    });

    describe('Estimates Fees', () => {
      it('does a very simple fee calculation', async () => {
        //sinon.stub(helpers, "getGasPrice").returns(Promise.resolve(1));
        const flashbotAdjustment = 2;
        const token = zenethSupportedTokens.tokens[0];
        const estimatedGas = token.gasEstimates;
        expect(
          await zenethRelayer.estimateFee(
            token.symbol,
            estimatedGas.approve,
            estimatedGas.transfer,
            estimatedGas.swapAndBribe,
            flashbotAdjustment
          )
        ).to.equal(18);
      });
    });

    describe('Sends bundles', () => {
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

        // PREPARE BUNDLE
        const signedTxs = [sig1, sig2, sig3]; // put signed transactions into an array
        const currentBlock = await goerliProvider.getBlockNumber(); // get block number of most recently mined block
        const validBlock = currentBlock + 2; // only block number we allow this bundle be mined for

        // SEND BUNDLE
        const flashbotsTx = await zenethRelayer.sendBundle(signedTxs, validBlock);

        // OUTPUT ASSERTIONS
        if ('error' in flashbotsTx) {
          // Here, flashbotsTx is of type RelayResponseError. For testing we do not expect to see this
          console.log('RelayResponseError: ', flashbotsTx);
          throw new Error('Promise resolved to RelayResponseError');
        }

        // If here, we now flashbotsTx is of type FlashbotsTransactionResponse
        expect(flashbotsTx.bundleTransactions.length).to.equal(signedTxs.length);
        const result = await flashbotsTx.wait(); // resolves to 0, 1, or 2 per type FlashbotsBundleResolution
        expect([0, 1, 2].includes(result)).to.be.true;
      });

      it('does not send bundles with transactions that revert', async () => {
        // Get nonce to use
        const nonce = await goerliProvider.getTransactionCount(user.address);

        // TRANSACTION
        // Use a dai transfer
        const transferData = dai.interface.encodeFunctionData('transfer', [user.address, transferAmount]);
        const tx1 = {
          chainId,
          data: transferData,
          from: user.address,
          gasLimit: BigNumber.from('21000'), // but gas limit is too low
          gasPrice: Zero,
          nonce,
          to: dai.address,
          value: Zero,
        };
        const sig1 = await user.signTransaction(tx1);

        // SEND BUNDLE
        const errorMessage = 'Simulation error occurred, exiting. Please make sure you are sending a valid bundle';
        const signedTxs = [sig1];
        const validBlocks = 1;
        await expectRejection(zenethRelayer.sendBundle(signedTxs, validBlocks), errorMessage);
      });
    });

    describe('Transaction signing', () => {
      it('populates transactions', async () => {
        // Provide a transaction with the minimum number of fields
        const tx = { from: user.address, to: dai.address, gasLimit: '21000' };
        const populatedTx = await zenethRelayer.populateTransaction(tx);
        expect(populatedTx.chainId).to.equal(goerliProvider.network.chainId);
        expect(populatedTx.data).to.equal('0x');
        expect(populatedTx.gasPrice).to.equal(Zero);
        expect(populatedTx.gasLimit).to.equal(tx.gasLimit);
        expect(populatedTx.nonce).to.equal(await goerliProvider.getTransactionCount(user.address));
        expect(populatedTx.to).to.equal(tx.to);
        expect(populatedTx.value).to.equal(Zero);

        // Provide a transaction with the maximum number of fields
        const nonce = await goerliProvider.getTransactionCount(user.address);
        const tx2 = { from: user.address, to: dai.address, gasLimit: '21000', nonce, value: '1', data: '0x1234' };
        const populatedTx2 = await zenethRelayer.populateTransaction(tx2);
        expect(populatedTx2.chainId).to.equal(goerliProvider.network.chainId);
        expect(populatedTx2.data).to.equal(tx2.data);
        expect(populatedTx2.gasPrice).to.equal(Zero);
        expect(populatedTx2.gasLimit).to.equal(tx2.gasLimit);
        expect(populatedTx2.nonce).to.equal(tx2.nonce);
        expect(populatedTx2.to).to.equal(tx2.to);
        expect(populatedTx2.value).to.equal(tx2.value);
      });

      it('populates multiple transactions at once', async () => {
        const recipient = Wallet.createRandom();
        const txFragment1 = {
          data: dai.interface.encodeFunctionData('transfer', [recipient.address, transferAmount]),
          gasLimit: '200000',
          to: dai.address,
          value: '0',
        };
        const txFragment2 = {
          data: dai.interface.encodeFunctionData('approve', [swapAndBribe.address, MaxUint256]),
          gasLimit: '300000',
          to: dai.address,
          value: '0',
        };
        const txFragments = [txFragment1, txFragment2];
        const populatedTxs = await zenethRelayer.populateTransactions(user.address, txFragments);

        const initialNonce = await goerliProvider.getTransactionCount(user.address);
        populatedTxs.forEach((populatedTx, index) => {
          expect(populatedTx.chainId).to.equal(goerliProvider.network.chainId);
          expect(populatedTx.data).to.equal(txFragments[index].data);
          expect(populatedTx.gasLimit).to.equal(txFragments[index].gasLimit);
          expect(populatedTx.gasPrice).to.equal(Zero);
          expect(populatedTx.nonce).to.equal(initialNonce + index);
          expect(populatedTx.to).to.equal(txFragments[index].to);
          expect(populatedTx.value).to.equal(txFragments[index].value);
        });
      });

      it('signs transactions correctly', async () => {
        // TODO more robust test that uses eth_sign to replicate MetaMask behavior. This uses signTransaction which
        // is currently not supported by MetaMask
        const recipient = Wallet.createRandom();
        const nonce = await goerliProvider.getTransactionCount(user.address);
        const tx1 = {
          chainId,
          data: dai.interface.encodeFunctionData('transfer', [recipient.address, transferAmount]),
          gasLimit: BigNumber.from('250000'),
          gasPrice: Zero,
          nonce,
          to: dai.address,
          value: Zero,
        };
        const sig1 = await user.signTransaction(tx1);
        expect(sig1).to.have.length.greaterThan(0);
        expect(typeof sig1 === 'string').to.be.true;
      });
    });
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
