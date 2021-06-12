import { getGasPrice, getTokenPriceInUsd } from './helpers';
import { ethAddress } from './constants';
import { BigNumberish, BigNumber } from '@ethersproject/bignumber';
import { formatEther, parseUnits } from '@ethersproject/units';

/**
 * @notice Estimates the fee (in base token units) for a bundle
 * @param obj
 * @param obj.tokenAddress Token in which fee will be expressed as units of
 * @param obj.bundleGasLimit Upper bound gas fee (in wei) for entire bundle
 * @param obj.flashbotsPremiumMultiplier Multiplier for flashbots bribing miner, e.g. 1.05 to add 5%
 * @returns Estimated fee for miner in token base units
 */
export const estimateFee = async ({
  tokenAddress,
  tokenDecimals,
  bundleGasLimit,
  flashbotsPremiumMultiplier,
}: {
  tokenAddress: string;
  tokenDecimals: number;
  bundleGasLimit: BigNumberish;
  flashbotsPremiumMultiplier: number;
}): Promise<BigNumber> => {
  const [gasPriceInWei, tokenPrice, ethPrice] = await Promise.all([
    getGasPrice(),
    getTokenPriceInUsd(tokenAddress),
    getTokenPriceInUsd(ethAddress),
  ]);

  const bundleGasUsed = BigNumber.from(bundleGasLimit); // total gas needed
  const bundlePriceInWei = bundleGasUsed.mul(gasPriceInWei); // total gas price in wei
  const scaledBundlePriceInWei = bundlePriceInWei.mul(BigNumber.from(flashbotsPremiumMultiplier * 1000)).div(1000); // total gas, scaled up
  const bundlePriceInEth = +formatEther(scaledBundlePriceInWei); // total gas, denominated in ETH
  const bundlePriceInUsd = bundlePriceInEth * ethPrice; // total gas, denominated in dollars
  const tokensNeededForBribe = parseUnits(String(bundlePriceInUsd / tokenPrice), tokenDecimals); // total gas, demoninated in token
  return tokensNeededForBribe;
};
