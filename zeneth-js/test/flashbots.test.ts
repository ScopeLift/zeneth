import { expect } from 'chai';
import { JsonRpcProvider } from '@ethersproject/providers';
import { FlashbotsRelayer } from '../src/index';

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

  describe('Usages', () => {
    let flashbotsRelayer: FlashbotsRelayer;

    beforeEach(async () => {
      flashbotsRelayer = await FlashbotsRelayer.create(goerliProvider);
    });

    it('sends bundles', () => {
      console.log(flashbotsRelayer);
    });

    it('does not send bundles with transactions that revert');
  });
});
