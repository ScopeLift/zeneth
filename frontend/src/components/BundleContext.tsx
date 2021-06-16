import { createContext, useState, ReactNode, useContext, Dispatch, useEffect } from 'react';
import { ChainContext } from './ChainContext';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { ZenethRelayer } from '@scopelift/zeneth-js';
import { NotificationContext } from './NotificationContext';

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
  const { notify } = useContext(NotificationContext);
  const bundleStatus = 'hi';

  useEffect(() => {
    const sendBundle = async () => {
      const targetBlock = blockNumber + 2;
      if (!library || !signedBundle) return;
      try {
        console.log(`sending bundle for block ${targetBlock}`);
        const relayer = await ZenethRelayer.create(library, process.env.AUTH_PRIVATE_KEY);
        const response = await relayer.sendBundle(signedBundle, targetBlock);
        if (response.error) {
          throw new Error(response.error);
        }
        const flashbotsResponse = await response.wait();
        console.log(flashbotsResponse);
        if (flashbotsResponse === 0) {
          setSignedBundle(undefined);
          notify({
            heading: 'Bundle mined',
            type: 'success',
            body: `Bundle mined in block ${targetBlock}! Check console for receipt details`,
          });
          console.log(await response.receipts());
        } else {
          notify({
            heading: 'Bundle not mined, retrying',
            type: 'info',
            body: `Block ${targetBlock}: bundle submitted but not mined, retrying...`,
          });
        }
      } catch (e) {
        setSignedBundle(undefined);
        notify({ heading: 'Error', type: 'error', body: `Block ${targetBlock}: ${e.message as string}` });
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
