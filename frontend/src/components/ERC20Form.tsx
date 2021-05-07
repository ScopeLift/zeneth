import { useState, Fragment, Dispatch } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { Listbox } from '@headlessui/react';
import { TokenInfo } from 'types';
import { Contract } from '@ethersproject/contracts';
import { CheckIcon } from '@heroicons/react/solid';

const abi = [
  // Read-Only Functions
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',

  // Authenticated Functions
  'function transfer(address to, uint amount) returns (boolean)',

  // Events
  'event Transfer(address indexed from, address indexed to, uint amount)',
];

const supportedTokens: TokenInfo[] = [
  {
    address: '0xB5Fcbf962529ED7E162fD5d8168990379ecBe416',
    name: 'TestnetDAI',
    symbol: 'DAI',
    chainId: 5,
    decimals: 18,
  },
];

const inputStyle = 'bg-gray-200 rounded p-3 w-full block';

const L2Form = () => {
  const { account, library } = useWeb3React<Web3Provider>();
  const [token, setToken] = useState<TokenInfo>();
  const doSubmit = async (e) => {
    e.preventDefault();
    if (!token?.address) throw new Error('token not set');
    const erc20 = new Contract(token.address, abi);
    await erc20.connect(library.getSigner()).transfer(account, 10000000);
    console.log('submit');
  };

  const formGroup = 'my-2 flex flex-row';
  const label = 'w-28 block self-center';
  return (
    <div className="border-green-100 drop-shadow-sm">
      <form className="flex flex-col">
        <div className={formGroup}>
          <label className={label}>Token</label>
          <TokenListbox selectedToken={token} supportedTokens={supportedTokens} setToken={setToken} />
        </div>
        <div className={formGroup}>
          <label className={label}>Recipient</label>
          <input className={inputStyle} />
        </div>
        <div className={formGroup}>
          <label className={label}>Amount</label>
          <input className={inputStyle} />
        </div>
        <div className={formGroup}>
          <label className={label}>Miner Fee</label>
          <input className={inputStyle} />
        </div>
        <button onClick={doSubmit}>Submit</button>
      </form>
    </div>
  );
};

const TokenListbox = ({
  supportedTokens,
  selectedToken,
  setToken,
}: {
  supportedTokens: TokenInfo[];
  selectedToken: TokenInfo | undefined;
  setToken: Dispatch<any>;
}) => {
  // const [selectedToken, setSelectedToken] = useState<TokenInfo>();
  return (
    <Listbox value={selectedToken} onChange={setToken}>
      <Listbox.Button className={inputStyle}>
        {selectedToken ? `${selectedToken.symbol} (${selectedToken.address})` : 'Select Token'}
      </Listbox.Button>
      <Listbox.Options>
        {supportedTokens.map((token) => (
          <Listbox.Option key={token.address} value={token} as={Fragment}>
            {({ active, selected }) => (
              <li className={`${active ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}>
                {selected && <CheckIcon className="h-5 w-5 text-blue-500" />}
                {token.symbol}
              </li>
            )}
          </Listbox.Option>
        ))}
      </Listbox.Options>
    </Listbox>
  );
};

export default L2Form;
