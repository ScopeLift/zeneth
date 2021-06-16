import { AppConfig } from 'types';

export const config: AppConfig = {
  defaultNetwork: 5,
  relayerFeePadding: 0.05,
  flashbotsPremiumMultipliers: [1.5, 2, 2.5, 3],
  networks: {
    1: {
      name: 'Mainnet',
      rpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_ID}`,
      addresses: {
        swapBriber: '0xC5335682964ED0667F8706d8783098664F69BB0a',
        weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        uniswapRouter: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      },
    },
    5: {
      name: 'Goerli',
      rpcUrl: `https://goerli.infura.io/v3/${process.env.INFURA_ID}`,
      addresses: {
        swapBriber: '0x956F963f8e05d000675627cA002667BaA13C7D28',
        weth: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
        uniswapRouter: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      },
    },
  },
};
