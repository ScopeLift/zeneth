export { TokenList, TokenInfo } from '@uniswap/token-lists/dist/types';

type NetworkEntry = {
  name: string;
  rpcUrl: string;
  swapBriber: string;
};

export type AppConfig = {
  networks: Record<number, NetworkEntry>;
  defaultNetwork: number;
};
