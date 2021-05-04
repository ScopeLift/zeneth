import { useState, Fragment } from 'react';
import { Listbox } from '@headlessui/react';
import { TokenInfo } from 'types';
import { CheckIcon } from '@heroicons/react/solid';

const supportedTokens: TokenInfo[] = [
  {
    address: '0x0',
    name: 'Whatever',
    symbol: 'DAI',
    chainId: 1,
    decimals: 18,
  },
];

const inputStyle = 'bg-gray-200 rounded p-3 w-full block';

const L2Form = () => {
  const doSubmit = async (e) => {
    e.preventDefault();
    await Promise.resolve('hi');
    console.log('submit');
  };
  const formGroup = 'my-2 flex flex-row';
  const label = 'w-28 block self-center';
  return (
    <div className="border-green-100 drop-shadow-sm">
      <form className="flex flex-col">
        <div className={formGroup}>
          <label className={label}>Token</label>
          <TokenListbox supportedTokens={supportedTokens} />
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

const TokenListbox = ({ supportedTokens }: { supportedTokens: TokenInfo[] }) => {
  const [selectedToken, setSelectedToken] = useState<TokenInfo>();
  return (
    <Listbox value={selectedToken} onChange={setSelectedToken}>
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
