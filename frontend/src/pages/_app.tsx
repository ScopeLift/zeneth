import 'tailwindcss/tailwind.css';
import { FC } from 'react';

import Header from 'components/Header';
import { Web3Provider } from '@ethersproject/providers';
import { Web3ReactProvider } from '@web3-react/core';
import { WithModal } from 'components/Modal';

import Footer from 'components/Footer';

const getLibrary = (provider: any): Web3Provider => {
  const library = new Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
};

const MyApp = ({ Component, pageProps }: { Component: FC; pageProps: Record<string, unknown> }) => {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <WithModal>
        <div className="flex flex-col items-center h-screen">
          <div className="my-5">
            <Header />
          </div>
          <div className="my-5 flex-grow">
            <Component {...pageProps} />
          </div>
          <div className="my-5">
            <Footer />
          </div>
        </div>
      </WithModal>
    </Web3ReactProvider>
  );
};

export default MyApp;
