import hre, { ethers } from 'hardhat';
const { isAddress } = ethers.utils;
const { AddressZero } = ethers.constants;
import { Artifact } from 'hardhat/types';
import { expect, use } from 'chai';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
const { deployContract, solidity } = hre.waffle;
use(solidity);

import { BaseSweepable } from '../typechain';

describe('BaseSweepable', () => {
  let owner: SignerWithAddress;
  let other: SignerWithAddress;
  let receiver1: SignerWithAddress;
  let receiver2: SignerWithAddress;
  let sweeper1: SignerWithAddress;
  let sweeper2: SignerWithAddress;
  let sweepable: BaseSweepable;

  before(async () => {
    [owner, other, receiver1, receiver2, sweeper1, sweeper2] = await hre.ethers.getSigners();
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

  it('should not let a non-owner updated the receiver', async () => {
    const txp = sweepable.connect(other).setSweepReceiver(receiver2.address);
    await expect(txp).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('should not let a non-owner update the sweeper', async () => {
    const txp = sweepable.connect(other).setSweeper(sweeper2.address);
    await expect(txp).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('should not let the owner set the receiver to the 0-address', async () => {
    const txp = sweepable.connect(owner).setSweepReceiver(AddressZero);
    await expect(txp).to.be.revertedWith('BaseSweepable: Invalid 0-Addr');
  });

  it('should not let the owner set the sweeper to the 0-address', async () => {
    const txp = sweepable.connect(owner).setSweeper(AddressZero);
    await expect(txp).to.be.revertedWith('BaseSweepable: Invalid 0-Addr');
  });

  it('should let the owner update the receiver', async () => {
    const txp = sweepable.connect(owner).setSweepReceiver(receiver2.address);
    await expect(txp).to.emit(sweepable, 'SetSweepReceiver').withArgs(receiver1.address, receiver2.address);

    expect(await sweepable.sweepReceiver()).to.equal(receiver2.address);
  });

  it('should let the owner update the sweeper', async () => {
    const txp = sweepable.connect(owner).setSweeper(sweeper2.address);
    await expect(txp).to.emit(sweepable, 'SetSweeper').withArgs(sweeper1.address, sweeper2.address);

    expect(await sweepable.sweeper()).to.equal(sweeper2.address);
  });
});
