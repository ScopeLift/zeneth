import axios from 'axios';

/**
 * @notice Gets the current gas price via Gasnow API
 */
export const getGasPrice = async (): Promise<number> => {

  // get current gas price from GasNow
  const gasPriceUrl = 'https://www.gasnow.org/api/v3/gas/price';
  const gasPriceInWei = await axios
    .get(gasPriceUrl)
    .then((response) => response.data.data.rapid) // 99 percent likelihood of tx getting included in next block
    .catch((error) => {
      throw new Error(`Error on GasNow API: ${error.message}`);
    });

  return gasPriceInWei
}

/**
 * @notice Gets the given token price and Eth price in USD via Coingecko API
 * @param token symbol of token of which to fetch price
 */
export const getTokenAndEthPriceInUSD = async (token: string): Promise<{tokenPrice: number, ethPrice: number}> => {

  // get current gas price from GasNow  console.log("getting token and eth price")
  const coingeckoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${token},ethereum&vs_currencies=usd,usd`;
  let tokenPrice: number = 0;
  let ethPrice: number = 0;
  await axios
    .get(coingeckoUrl)
    .then((response) => { response.data.dai.usd, response.data.ethereum.usd
      ethPrice = response.data.ethereum.usd
      tokenPrice = response.data.dai.usd
    })
    .catch((error: { message: any; }) => {
      throw new Error(`Error on coingecko API: ${error.message}`);
    });
  return {tokenPrice, ethPrice}
}

