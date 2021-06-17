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
  const { notify, clearNotifications } = useContext(NotificationContext);
  const [bundleStatus, setBundleStatus] = useState<'pending' | 'error' | 'success'>();

  useEffect(() => {
    const abortController = new AbortController();
    const sendBundle = async (abortSignal) => {
      const targetBlock = blockNumber + 2;
      if (!library || !signedBundle) return;
      setBundleStatus('pending');

      try {
        console.log(`sending bundle for block ${targetBlock}`);
        const relayer = await ZenethRelayer.create(library, process.env.AUTH_PRIVATE_KEY);
        const response = await relayer.sendBundle(signedBundle, targetBlock);
        if (response.error) {
          throw new Error(response.error);
        }
        const flashbotsResponse = await Promise.race([
          response.wait(),
          new Promise((_resolve, reject) => {
            abortSignal.addEventListener('abort', () => {
              const error = new Error('abort');
              reject(error);
            });
          }),
        ]);
        console.log(flashbotsResponse);
        if (flashbotsResponse === 0) {
          setSignedBundle(undefined);
          abortController.abort();
          setBundleStatus('success');
          notify({
            heading: 'Success!',
            type: 'success',
            body: `Block ${targetBlock}: bundle mined! Check console for receipt details.`,
          });
          console.log(await response.receipts());
        } else {
          notify({
            heading: 'Retrying...',
            type: 'info',
            body: `Block ${targetBlock}: bundle was not included.`,
          });
        }
      } catch (e) {
        console.log(targetBlock, bundleStatus, e.message);
        setSignedBundle(undefined);
        if (e.message === 'abort') return;
        setBundleStatus('error');
        abortController.abort();
        console.log(targetBlock, bundleStatus);
        notify({ heading: 'Error', type: 'error', body: `Block ${targetBlock}: ${e.message as string}.` });
      }
    };
    sendBundle(abortController.signal);
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
