import axios from 'axios';

/**
 * @notice Gets the current gas price via Gasnow API
 */
export const getGasPrice = async (): Promise<number> => {

    // get current gas price from GasNow
    const gasPriceUrl = 'https://www.gasnow.org/api/v3/gas/price';
    const gasPriceInWei: number = await axios
      .get(gasPriceUrl)
      .then((response: { data: { data: { rapid: any; }; }; }) => response.data.data.rapid) // 99 percent likelihood of tx getting included in next block
      .catch((error: { message: any; }) => {
        throw new Error(`Error on GasNow API: ${error.message}`);
      });
    
    return gasPriceInWei
}

