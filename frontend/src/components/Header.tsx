import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { BlockNumber } from 'components/BlockNumber';
import { Connection } from 'components/Connection';
import Link from 'next/link';

export const Header = () => {
  const { chainId } = useWeb3React<Web3Provider>();
  return (
    <div className="flex justify-between w-screen border-b-2 border-0 pb-5">
      <Link href="/">
        <div id="logo" className="flex flex-row ml-10 mr-5 items-center cursor-pointer">
          <img src="/static/images/logo.jpg" alt="Zeneth logo" className="h-16 w-16" />
          <div className="ml-5">
            <span className="text-xl leading">Zeneth</span>
            <br />
            <span className="text-gray-500 font-light">Let your ETH chill</span>
          </div>
        </div>
      </Link>
      <div className="flex items-center justify-end">
        <span className="relative z-0 inline-flex shadow-sm rounded-md">
          <button
            type="button"
            className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <Connection />
          </button>
          <div className="-ml-px relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 ">
            Chain ID: {chainId}
          </div>
          <div className="-ml-px relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500">
            <BlockNumber />
          </div>
        </span>
      </div>
    </div>
  );
};

export default Header;
