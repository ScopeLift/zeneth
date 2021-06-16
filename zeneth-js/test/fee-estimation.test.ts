import { formatUnits } from '@ethersproject/units';
import { expect } from 'chai';
import fetch from 'node-fetch';

import { BigNumber } from '@ethersproject/bignumber';
import * as sinon from 'sinon';
import * as helpers from '../src/helpers';

// @ts-expect-error types don't match
global.fetch = fetch; // we don't have the browser's fetch so replace with node-fetch for testing

import { estimateFee } from '../src';

describe('Estimates Fees', () => {
  it('does a very simple fee calculation', async () => {
    sinon.stub(helpers, 'getGasPrice').returns(Promise.resolve(BigNumber.from(2e10)));
    sinon.stub(helpers, 'getTokenPriceInUsd').returns(Promise.resolve(1));
    sinon.stub(helpers, 'getEthPriceInUsd').returns(Promise.resolve(2000));
    const estimate = await estimateFee({
      tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      tokenDecimals: 18,
      bundleGasLimit: [50000, 100000, 150000].reduce((x, y) => x + y),
      flashbotsPremiumMultiplier: 2,
    });
    const humanFee = Number(formatUnits(estimate.bribeInTokens, 18));
    expect(humanFee).to.equal(24);
  });
});
