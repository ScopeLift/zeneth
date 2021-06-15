import { useContext } from 'react';
import { ChainContext } from './ChainContext';

export const BlockNumber = () => {
  const { blockNumber } = useContext(ChainContext);

  return <div>Block Number: {blockNumber.toString()}</div>;
};
