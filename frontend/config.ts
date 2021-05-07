import { AppConfig } from 'types';

export const config: AppConfig = {
  defaultNetwork: 5,
  networks: {
    1: {
      name: 'Mainnet',
      rpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_ID as string}`,
      swapBriber: '0xC5335682964ED0667F8706d8783098664F69BB0a',
    },
    5: {
      name: 'Goerli',
      rpcUrl: `https://goerli.infura.io/v3/${process.env.INFURA_ID as string}`,
      swapBriber: '0x956F963f8e05d000675627cA002667BaA13C7D28',
    },
  },
};
