import hre from 'hardhat';
import { Artifact } from 'hardhat/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

import { Signers } from '../types';
import { shouldBehaveLikeGreeter } from './Greeter.behavior';
import { Greeter } from '../typechain';

const { deployContract } = hre.waffle;

describe('Unit tests', function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await hre.ethers.getSigners();
    this.signers.admin = signers[0];
  });

  describe('Greeter', function () {
    beforeEach(async function () {
      const greeting = 'Hello, world!';
      const greeterArtifact: Artifact = await hre.artifacts.readArtifact('Greeter');
      this.greeter = await deployContract(this.signers.admin, greeterArtifact, [greeting]) as Greeter;
    });

    shouldBehaveLikeGreeter();
  });
});
