import { AppConfig } from 'types';

export const config: AppConfig = {
  defaultNetwork: 5,
  networks: {
    1: {
      name: 'Mainnet',
      rpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_ID as string}`,
    },
    4: {
      name: 'Rinkeby',
      rpcUrl: `https://rinkeby.infura.io/v3/${process.env.INFURA_ID as string}`,
    },
    5: {
      name: 'Goerli',
      rpcUrl: `https://goerli.infura.io/v3/${process.env.INFURA_ID as string}`,
    },
  },
};
