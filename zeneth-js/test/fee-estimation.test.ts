import { formatUnits } from '@ethersproject/units';
import { expect } from 'chai';
import fetch from 'node-fetch';

// @ts-expect-error types don't match
global.fetch = fetch; // we don't have the browser's fetch so replace with node-fetch for testing

import { estimateFee } from '../src';

describe('Estimates Fees', () => {
  it('does a very simple fee calculation', async () => {
    const fee = await estimateFee({
      tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      tokenDecimals: 18,
      bundleGasLimit: [50000, 125000, 300000].reduce((x, y) => x + y),
      flashbotsPremiumMultiplier: 2,
    });
    const humanFee = Number(formatUnits(fee, 18)); // scale to human-readable value
    expect(humanFee).to.be.greaterThanOrEqual(10);
    expect(humanFee).to.be.lessThanOrEqual(100);
  });
});
