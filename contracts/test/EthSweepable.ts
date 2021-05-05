import hre, { ethers } from 'hardhat';
const { provider } = ethers;
const { isAddress, parseEther } = ethers.utils;
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

  const sendAmount = parseEther('0.361');

  before(async () => {
    [owner, other, receiver, sweeper] = await hre.ethers.getSigners();
    AddressZero;
  });

  beforeEach(async () => {
    const sweepableArtifact: Artifact = await hre.artifacts.readArtifact('EthSweepable');
    sweepable = (await deployContract(owner, sweepableArtifact, [receiver.address, sweeper.address])) as EthSweepable;
    expect(isAddress(sweepable.address), 'Failed to deploy EthSweepable').to.be.true;

    // Empty the receiver's balance
    let receiverBalance = await provider.getBalance(receiver.address);
    await receiver.sendTransaction({
      to: owner.address,
      value: receiverBalance,
    });
    receiverBalance = await provider.getBalance(receiver.address);
    expect(receiverBalance.eq(0), 'Failed to empty receiver balance').to.be.true;
  });

  it('should not let a non-sweeper sweep', async () => {
    const txp = sweepable.connect(other).sweepEth();
    await expect(txp).to.be.revertedWith('BaseSweepable: Not Sweeper');
  });

  it('should send to the receiver when swept', async () => {
    await other.sendTransaction({
      to: sweepable.address,
      value: sendAmount,
    });

    let sweepableBalance = await provider.getBalance(sweepable.address);
    expect(sweepableBalance.eq(sendAmount), 'Failed to send to sweepable').to.be.true;

    const txp = sweepable.connect(sweeper).sweepEth();
    await expect(txp).to.emit(sweepable, 'SweptEth').withArgs(receiver.address);

    sweepableBalance = await provider.getBalance(sweepable.address);
    expect(sweepableBalance.eq(0), 'Failed to sweep').to.be.true;

    const receiverBalance = await provider.getBalance(receiver.address);
    expect(receiverBalance.eq(sendAmount), 'Failed to sweep to receiver').to.be.true;
  });
});
