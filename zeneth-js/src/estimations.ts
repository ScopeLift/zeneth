
  /**
   * @notice Estimates the fee (in base token units) for a bundle
   * @param token Token in which fee will be expressed as units of
   * @param transferUpperBound Given upper bound gas fee (in Gwei) for transfer
   * @param approveUpperBound Given upper bound gas fee (in Gwei) for approve
   * @param swapUpperBound Given upper bound gas fee (in Gwei) for swap
   * @param flashbotsAdjustment Multiplier for flashbots bribing miner.
   *
   * @returns Estimated fee for miner in token base units
   */
 export const estimateFee = async (
    token: string,
    transferUpperBound: number,
    approveUpperBound: number,
    swapUpperBound: number,
    flashbotsAdjustment: number
  ): Promise<number> => {
    // get current gas price
    const gasPriceInWei = await getGasPrice();
    const { tokenPrice, ethPrice } = await getTokenAndEthPriceInUSD(token);

    const bundleGasUsed = transferUpperBound + approveUpperBound + swapUpperBound;
    const initiallyCalculatedFee = bundleGasUsed * gasPriceInWei;
    const bundleGasEtimateinWei = initiallyCalculatedFee * flashbotsAdjustment;
    const amountOfEthUsedInGas = bundleGasEtimateinWei / 1e18;
    const dollarsNeededForBribe = amountOfEthUsedInGas / ethPrice;
    const tokensNeededForBribe = dollarsNeededForBribe * tokenPrice;

    console.log(`token: ${token}`);
    console.log(`gas price in wei: ${gasPriceInWei}`);
    console.log(`token price and eth price: ${tokenPrice}, ${ethPrice}`);
    console.log(`Bundle gas used is: ${bundleGasUsed}`);
    console.log(`Initially Estimated fee in Wei is: ${initiallyCalculatedFee}`);
    console.log(`Estimated fee in Wei (after flashbots adjustment): ${bundleGasEtimateinWei}`);
    console.log(`Amount of Eth used in Gas: ${amountOfEthUsedInGas}`);
    console.log(`Amount of dollars needed for bribe: ${dollarsNeededForBribe}`);
    console.log(`Amount of tokens needed for bribe: ${tokensNeededForBribe}`);

    return bundleGasEtimateinWei;
  }
}
