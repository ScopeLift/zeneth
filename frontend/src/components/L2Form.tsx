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

const L2Form = () => {
  return (
    <div>
      <form>
        <TokenListbox supportedTokens={supportedTokens} />
      </form>
    </div>
  );
};

const TokenListbox = ({ supportedTokens }: { supportedTokens: TokenInfo[] }) => {
  const [selectedToken, setSelectedToken] = useState(supportedTokens[0]);
  return (
    <Listbox value={selectedToken} onChange={setSelectedToken}>
      <Listbox.Button>Token</Listbox.Button>
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
