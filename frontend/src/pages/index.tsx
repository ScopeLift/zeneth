import Header from 'components/Header';
// import ERC20Form from 'components/ERC20Form';
import { Web3Provider } from '@ethersproject/providers';
import { Web3ReactProvider } from '@web3-react/core';
import { WithModal } from 'components/Modal';
import L2Form from 'components/L2Form';

import Footer from 'components/Footer';

const getLibrary = (provider: any): Web3Provider => {
  const library = new Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
};

const Index = () => {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <WithModal>
        <div className="flex flex-col items-center">
          <div className="my-5">
            <Header />
          </div>
          <div className="my-5">{/* <ERC20Form /> */}</div>
          <L2Form />
          <div className="my-5">
            <Footer />
          </div>
        </div>
      </WithModal>
    </Web3ReactProvider>
  );
};

export default Index;
