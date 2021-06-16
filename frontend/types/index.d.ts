import { TokenList as UniTokenList, TokenInfo as UniTokenInfo } from '@uniswap/token-lists/dist/types';

export interface TokenInfo extends UniTokenInfo {
  gasEstimates: Record<string, number>;
}

export interface TokenList extends UniTokenList {
  tokens: TokenInfo[];
}

type NetworkEntry = {
  name: string;
  rpcUrl: string;
  addresses: Record<string, string>;
};

export type AppConfig = {
  networks: Record<number, NetworkEntry>;
  defaultNetwork: number;
  relayerFeePadding: number;
  flashbotsPremiumMultipliers: number[];
};
