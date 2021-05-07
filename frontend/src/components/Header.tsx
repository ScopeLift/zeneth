import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { BlockNumber } from 'components/BlockNumber';
import { Connection } from 'components/Connection';

export const Header = () => {
  const { chainId } = useWeb3React<Web3Provider>();
  return (
    <div>
      <Connection />
      {chainId}
      <BlockNumber />
    </div>
  );
};

export default Header;
