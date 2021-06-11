import { NetworkConnector } from '@web3-react/network-connector';
import { InjectedConnector } from '@web3-react/injected-connector';
import { config } from '../../config';

const RPC_URLS = Object.entries(config.networks).reduce((prev, [key, val]) => {
  return { ...prev, [key]: val.rpcUrl };
}, {});

export const network = new NetworkConnector({
  urls: RPC_URLS,
  defaultChainId: config.defaultNetwork,
});

export const injected = new InjectedConnector({
  supportedChainIds: Object.keys(RPC_URLS).map(Number),
});
