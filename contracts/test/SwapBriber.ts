import hre, { ethers } from 'hardhat';
const { isAddress, parseUnits } = ethers.utils;
import { Artifact } from 'hardhat/types';
// import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

// import { Signers } from '../types';
import { SwapBriber, TestToken } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { IUniswapV2Factory } from '../typechain/IUniswapV2Factory';

const { deployContract } = hre.waffle;

// Import Uniswap contract artifacts from their package
const UniswapV2FactoryArtifact = require('@uniswap/v2-core/build/UniswapV2Factory.json');
// const UniswapV2PairArtifact = require('@uniswap/v2-core/build/UniswapV2Pair.json');
// const UniswapV2Router02Artifact = require('@uniswap/v2-periphery/build/UniswapV2Router02.json');

describe('SwapBriber', () => {
  let admin: SignerWithAddress;
  let sender: SignerWithAddress;
  let token: TestToken;
  let briber: SwapBriber;
  let uniswapFactory: IUniswapV2Factory;

  const bribeTokens = parseUnits('1000', 18);

  before(async () => {
    [ admin, sender ] = await hre.ethers.getSigners();
  });

  it('should deploy', async () => {
    const testTokenArtifact: Artifact = await hre.artifacts.readArtifact('TestToken');
    token = await deployContract(admin, testTokenArtifact, ['Test Token', 'TT']) as TestToken;
    expect(isAddress(token.address), 'Failed to deploy TestToken');

    const swapBriberArtifact: Artifact = await hre.artifacts.readArtifact('SwapBriber');
    briber = await deployContract(admin, swapBriberArtifact, []) as SwapBriber;
    expect(isAddress(briber.address), 'Failed to deploy SwapBriber');

    uniswapFactory = await deployContract(admin, UniswapV2FactoryArtifact, [admin.address]) as IUniswapV2Factory;
    expect(isAddress(uniswapFactory.address), 'Failed to deploy Uniswap Factory');
  });

  it('should mint tokens', async () => {
    await token.mint(sender.address, bribeTokens);
    const balance = await token.balanceOf(sender.address);
    expect(balance.eq(bribeTokens), 'Failed to mint tokens');
  });
});