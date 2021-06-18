import 'tailwindcss/tailwind.css';
import { FC } from 'react';

import Header from 'components/Header';
import { Web3Provider } from '@ethersproject/providers';
import { Web3ReactProvider } from '@web3-react/core';
import { WithModal } from 'components/ModalContext';
import { WithChainContext } from 'components/ChainContext';
import Footer from 'components/Footer';
import { WithBundleManager } from 'components/BundleContext';

import { WithNotifications } from 'components/NotificationContext';

const getLibrary = (provider: any): Web3Provider => {
  const library = new Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
};

const MyApp = ({ Component, pageProps }: { Component: FC; pageProps: Record<string, unknown> }) => {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <WithChainContext>
        <WithModal>
          <WithNotifications>
            <WithBundleManager>
              <div className="flex flex-col items-center h-screen">
                <div className="my-5">
                  <Header />
                </div>
                <div className="my-5 flex-grow flex flex-col h-full justify-center">
                  <Component {...pageProps} />
                </div>
                <div className="my-5">
                  <Footer />
                </div>
              </div>
            </WithBundleManager>
          </WithNotifications>
        </WithModal>
      </WithChainContext>
    </Web3ReactProvider>
  );
};

export default MyApp;
