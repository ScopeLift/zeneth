import hre, { ethers } from 'hardhat';
const { isAddress } = ethers.utils;
import { Artifact } from 'hardhat/types';
import { expect } from 'chai';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
const { deployContract } = hre.waffle;

import { BaseSweepable } from '../typechain';

describe('BaseSweepable', () => {
  let owner: SignerWithAddress;
  let receiver1: SignerWithAddress;
  let receiver2: SignerWithAddress;
  let sweeper1: SignerWithAddress;
  let sweeper2: SignerWithAddress;
  let sweepable: BaseSweepable;

  before(async () => {
    [owner, receiver1, receiver2, sweeper1, sweeper2] = await hre.ethers.getSigners();
    sweeper2;
    receiver2;
  });

  beforeEach(async () => {
    const sweepableArtifact: Artifact = await hre.artifacts.readArtifact('BaseSweepable');
    sweepable = (await deployContract(owner, sweepableArtifact, [
      receiver1.address,
      sweeper1.address,
    ])) as BaseSweepable;
    expect(isAddress(sweepable.address), 'Failed to deploy BaseSweepable').to.be.true;
  });

  it('should be deployed with the proper parameters', async () => {
    const _owner = await sweepable.owner();
    const sweepReceiver = await sweepable.sweepReceiver();
    const sweeper = await sweepable.sweeper();

    expect(_owner).to.equal(owner.address);
    expect(sweepReceiver).to.equal(receiver1.address);
    expect(sweeper).to.equal(sweeper1.address);
  });
});
