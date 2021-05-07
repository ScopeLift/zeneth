import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useEffect, useState } from 'react';

export const BlockNumber = () => {
  const { library } = useWeb3React<Web3Provider>();
  const [blockNumber, setBlockNumber] = useState<number>(0);

  useEffect(() => {
    if (!library) return;
    // listen for changes on an Ethereum address
    console.log(`listening for blocks...`);
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

  if (!blockNumber || !library) {
    return <> </>;
  }
  return (
    <div className="py-1 px-2 rounded border border-gray-400 text-xs text-gray-400 mr-2">
      Block Number: {blockNumber.toString()}
    </div>
  );
};
