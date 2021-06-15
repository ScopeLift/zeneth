import { createContext, useState, ReactNode, useContext, Dispatch, useEffect } from 'react';
import { ChainContext } from './ChainContext';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { ZenethRelayer } from '@scopelift/zeneth-js';

type ContextProps = {
  signedBundle: string[] | undefined;
  bundleStatus: string;
  sendBundle: Dispatch<React.SetStateAction<string[]>> | undefined;
};

export const BundleContext = createContext<ContextProps>({
  signedBundle: undefined,
  bundleStatus: '',
  sendBundle: undefined,
});

export const WithBundleManager = ({ children }: { children: ReactNode }) => {
  const { library } = useWeb3React<Web3Provider>();
  const [signedBundle, setSignedBundle] = useState<string[]>();
  const sendBundle = setSignedBundle;
  const { blockNumber } = useContext(ChainContext);
  const bundleStatus = 'hi';
  let responses;

  useEffect(() => {
    const sendBundle = async () => {
      if (!library || !signedBundle) return;
      const relayer = await ZenethRelayer.create(library, process.env.AUTH_PRIVATE_KEY);
      const response = await relayer.sendBundle(signedBundle, blockNumber + 2);
      if (response.error) {
        alert(response.error.message);
        return;
      }
      const flashbotsResponse = await response.wait();
      console.log(flashbotsResponse);
      if (flashbotsResponse === 0) {
        setSignedBundle(undefined);
        console.log('bundle mined!');
        console.log(await response.receipts());
      }
    };
    sendBundle();
  }, [blockNumber, library, signedBundle]);

  return (
    <BundleContext.Provider
      value={{
        signedBundle,
        bundleStatus,
        sendBundle,
      }}
    >
      {children}
    </BundleContext.Provider>
  );
};
// export const sendUsersBundle = async ({
//   txs,
//   provider,
//   relayer,
// }: {
//   txs: string[];
//   provider: JsonRpcProvider;
//   relayer: ZenethRelayer;
// }) => {
//   const currentBlockNumber = await provider.getBlockNumber(); // get last mined block number
//   let nextBundleBlock = currentBlockNumber + 2;

//   // First bundle attempt
//   const response = await relayer.sendBundle(txs, nextBundleBlock);
//   const responses = [response];

//   let wasMined = false;
//   provider.on('block', async (block) => {
//     while (!wasMined) {
//       nextBundleBlock = block.number + 2;
//       const response = await relayer.sendBundle(txs, nextBundleBlock);
//       responses.push(response);
//     }
//     return null;
//   });

//   // For each response in responses, .wait() on it, and if it resolves to 0 it was mined.
//   // If mined, you can get the receipts with `await response.receipts()`
// };
