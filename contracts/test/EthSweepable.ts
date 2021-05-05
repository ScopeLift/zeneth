import hre, { ethers } from 'hardhat';
const { isAddress } = ethers.utils;
const { AddressZero } = ethers.constants;
import { Artifact } from 'hardhat/types';
import { expect, use } from 'chai';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
const { deployContract, solidity } = hre.waffle;
use(solidity);

import { EthSweepable } from '../typechain';

describe('EthSweepable', () => {
  let owner: SignerWithAddress;
  let other: SignerWithAddress;
  let receiver: SignerWithAddress;
  let sweeper: SignerWithAddress;
  let sweepable: EthSweepable;

  before(async () => {
    [owner, other, receiver, sweeper] = await hre.ethers.getSigners();
    AddressZero;
  });

  beforeEach(async () => {
    const sweepableArtifact: Artifact = await hre.artifacts.readArtifact('EthSweepable');
    sweepable = (await deployContract(owner, sweepableArtifact, [receiver.address, sweeper.address])) as EthSweepable;
    expect(isAddress(sweepable.address), 'Failed to deploy EthSweepable').to.be.true;

    // Empty the receiver's balance
    let receiverBalance = await ethers.provider.getBalance(receiver.address);
    await receiver.sendTransaction({
      to: owner.address,
      value: receiverBalance,
    });
    receiverBalance = await ethers.provider.getBalance(receiver.address);
    expect(receiverBalance.eq(0), 'Failed to empty receiver balance').to.be.true;
  });

  it('should not let a non-sweeper sweep', async () => {
    const txp = sweepable.connect(other).sweepEth();
    await expect(txp).to.be.revertedWith('BaseSweepable: Not Sweeper');
  });
});
