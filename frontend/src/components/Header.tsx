import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { BlockNumber } from 'components/BlockNumber';
import { Connection } from 'components/Connection';
import Image from 'next/image';

export const Header = () => {
  const { chainId } = useWeb3React<Web3Provider>();
  return (
    <div className="flex justify-between w-screen">
      <div id="logo" className="flex flex-row mx-5 items-center">
        <Image src="/static/images/logo.jpg" alt="Zeneth logo" width="64" height="64" />
        <div className="ml-5">Zeneth: Let your ETH chill</div>
      </div>
      <div className="flex items-center justify-end">
        <div className="mr-3">
          <Connection />
        </div>
        <div className="mr-3 bg-gray-100 text-sm p-2 rounded">Chain ID: {chainId}</div>
        <div className="mr-3 bg-gray-100 text-sm p-2 rounded">
          <BlockNumber />
        </div>
      </div>
    </div>
  );
};

export default Header;
