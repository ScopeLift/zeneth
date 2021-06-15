import { createContext, useState, ReactNode, useContext, Dispatch, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';

type ContextProps = {
  blockNumber: number;
};

export const ChainContext = createContext<ContextProps>({
  blockNumber: 0,
});

export const WithChainContext = ({ children }: { children: ReactNode }) => {
  const { library } = useWeb3React<Web3Provider>();
  const [blockNumber, setBlockNumber] = useState<number>(0);

  useEffect(() => {
    if (!library) return () => {};
    // listen for changes on an Ethereum address
    console.log('listening for blocks...');
    library.on('block', (data) => {
      console.log(data);
      setBlockNumber(data);
    });
    // remove listener when the component is unmounted
    return () => {
      library.removeAllListeners('block');
    };
    // trigger the effect only on component mount
  }, [library]);

  return (
    <ChainContext.Provider
      value={{
        blockNumber,
      }}
    >
      {children}
    </ChainContext.Provider>
  );
};
