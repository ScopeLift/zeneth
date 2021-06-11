import { GasNowSpeed, GasNowResponse } from './types';
import { BigNumber } from '@ethersproject/bignumber';

const jsonFetch = (url: string) => fetch(url).then((res) => res.json());

const tokenAddressToCoinGeckoId = {
  '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE': 'ethereum',
  '0x0D8775F648430679A709E98d2b0Cb6250d2887EF': 'basic-attention-token',
  '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': 'uniswap',
  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': 'bitcoin',
  '0x6B3595068778DD592e39A122f4f5a5cF09C90fE2': 'sushi',
  '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0': 'matic-network',
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 'ethereum',
  '0xD56daC73A4d6766464b38ec6D91eB45Ce7457c44': 'panvala-pan',
  '0x536381a8628dBcC8C70aC9A30A7258442eAb4c92': 'pantos',
  '0x514910771AF9Ca656af840dff83E8264EcF986CA': 'chainlink',
  '0xBBbbCA6A901c926F240b89EacB641d8Aec7AEafD': 'loopring',
};

const stablecoins = [
  '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
  '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
];

function isSupportedToken(tokenAddress: string): tokenAddress is keyof typeof tokenAddressToCoinGeckoId {
  return Object.keys(tokenAddressToCoinGeckoId).includes(tokenAddress);
}

/**
 * @notice Takes a token address or 0xEeEEeeee... and returns the price
 * @param tokenAddress Checksummed token address
 */
export const getTokenPriceInUsd = async (tokenAddress: string): Promise<number> => {
  try {
    // Return 1 for all stablecoins
    if (stablecoins.includes(tokenAddress)) return 1;

    // Throw if token does not have a CoinGecko mapping
    if (!isSupportedToken(tokenAddress)) throw new Error(`Unsupported token address ${tokenAddress}`);

    // Otherwise fetch price and return it
    const coinGeckoId = tokenAddressToCoinGeckoId[tokenAddress];
    const coingeckoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd`;
    const response: Record<string, { usd: number }> = await jsonFetch(coingeckoUrl);
    return response[coinGeckoId].usd;
  } catch (e) {
    throw new Error(`Error fetching price for ${tokenAddress}: ${e.message as string}`);
  }
};

/**
 * @notice Gets the current gas price via Gasnow API
 * @param gasPriceSpeed string of gas price speed from GasNow (e.g. `'rapid'`)
 */
export const getGasPrice = async (gasPriceSpeed: GasNowSpeed = 'rapid'): Promise<BigNumber> => {
  const gasPriceUrl = 'https://www.gasnow.org/api/v3/gas/price';
  try {
    const response: GasNowResponse = await jsonFetch(gasPriceUrl);
    const gasPriceInWei = response.data[gasPriceSpeed];
    return BigNumber.from(gasPriceInWei);
  } catch (e) {
    throw new Error(`Error on GasNow API: ${e.message as string}`);
  }
};
