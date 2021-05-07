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

  const [formState, setFormState] = useState<{
    token: TokenInfo | undefined;
    recipientAddress: string;
    amount: string;
    minerFee: string;
  }>({
    token: supportedTokens[0],
    recipientAddress: '',
    amount: '',
    minerFee: '',
  });
  if (!library) return null;
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.target.value;
    setFormState({
      ...formState,
      [e.target.name]: value,
    });
  };
  const doSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.token?.address) throw new Error('token not set');
    const erc20 = new Contract(formState.token.address, abi);
    await erc20.connect(library.getSigner()).transfer(account, formState.amount);
    console.log('submit');
  };

  const formGroup = 'my-2 flex flex-row';
  const label = 'w-28 block self-center';
  return (
    <div className="border-green-100 drop-shadow-sm">
      <form className="flex flex-col">
        <div className={formGroup}>
          <label className={label}>Token</label>
          <TokenListbox
            selectedToken={formState.token}
            supportedTokens={supportedTokens}
            setToken={(token) => setFormState({ ...formState, token })}
          />
        </div>
        <div className={formGroup}>
          <label className={label}>Recipient</label>
          <input name="recipientAddress" className={inputStyle} onChange={handleChange} />
        </div>
        <div className={formGroup}>
          <label className={label}>Amount</label>
          <input name="amount" className={inputStyle} onChange={handleChange} />
        </div>
        <div className={formGroup}>
          <label className={label}>Miner Fee</label>
          <input name="minerFee" className={inputStyle} onChange={handleChange} />
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
  setToken: Dispatch<TokenInfo>;
}) => {
  return (
    <Listbox value={selectedToken} onChange={setToken}>
      <Listbox.Button className={inputStyle}>
        {selectedToken ? `${selectedToken.symbol as string} (${selectedToken.address as string})` : 'Select Token'}
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
