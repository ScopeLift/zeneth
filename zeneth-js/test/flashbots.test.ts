// import * as chai from 'chai';
// import { expect } from 'chai';
import { Wallet } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import { FlashbotsRelayer } from '../src/index';

// Verify environment variables
const infuraId = process.env.INFURA_ID;
if (!infuraId) throw new Error('Please set your INFURA_ID in the .env file');
const authPrivateKey = process.env.AUTH_PRIVATE_KEY;
if (!authPrivateKey) throw new Error('Please set your AUTH_PRIVATE_KEY in the .env file');

const provider = new JsonRpcProvider(`https://mainnet.infura.io/v3/${infuraId}`);
const authWallet = new Wallet(authPrivateKey);
console.log(authWallet);

describe('Flashbots relayer', () => {
  it('initializes an instance with a random BigNumber', async () => {
    const flashbotsRelayer = await FlashbotsRelayer.create(provider);
    console.log(flashbotsRelayer);
  });

  it('sends bundles');

  it('does not send bundles with transactions that revert');
});
