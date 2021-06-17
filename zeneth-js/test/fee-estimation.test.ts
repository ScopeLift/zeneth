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
    // setup test gas limit value for bundle and mocked values from web API calls
    const bundleGasLimit = 300000;
    const mockedGasPrice = 2e10;
    const mockedTokenPrice = 1;
    const mockedEthPrice = 2000;
    sinon.stub(helpers, 'getGasPrice').returns(Promise.resolve(BigNumber.from(mockedGasPrice)));
    sinon.stub(helpers, 'getTokenPriceInUsd').returns(Promise.resolve(mockedTokenPrice));
    sinon.stub(helpers, 'getEthPriceInUsd').returns(Promise.resolve(mockedEthPrice));

    // calculated expected estimates for tokens and eth
    const expectedEthPriceForBundle = BigNumber.from(bundleGasLimit).mul(BigNumber.from(mockedGasPrice)).mul(2);
    const expectedBundlePriceInUsd = expectedEthPriceForBundle.mul(BigNumber.from(mockedEthPrice));
    const expectedTokensNeededForBribe = expectedBundlePriceInUsd.div(BigNumber.from(mockedTokenPrice));
    const humanReadableExpectedFeeForEth = Number(formatUnits(expectedEthPriceForBundle, 18));
    const humanReadableExpectedFeeForTokens = Number(formatUnits(expectedTokensNeededForBribe, 18));

    const estimate = await estimateFee({
      tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      tokenDecimals: 18,
      bundleGasLimit: bundleGasLimit,
      flashbotsPremiumMultiplier: 2,
    });

    // convert result from bignumbers to human-readable
    const humanReadableFeeForTokens = Number(formatUnits(estimate.bribeInTokens, 18));
    const humanReadableFeeForEth = Number(estimate.bribeInEth);

    expect(humanReadableFeeForEth).to.equal(humanReadableExpectedFeeForEth);
    expect(humanReadableFeeForTokens).to.equal(humanReadableExpectedFeeForTokens);
  });
});
