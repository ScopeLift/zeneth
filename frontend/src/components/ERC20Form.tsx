import { useState, Fragment, Dispatch, useContext } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { Listbox, Transition } from '@headlessui/react';
import { TokenInfo } from 'types';
import { Contract } from '@ethersproject/contracts';
import { MaxUint256 } from '@ethersproject/constants';
import { parseUnits } from '@ethersproject/units';
import { hexlify } from '@ethersproject/bytes';
import { CheckIcon, SelectorIcon } from '@heroicons/react/solid';
import { ZenethRelayer } from '@scopelift/zeneth-js';
import SwapBriber from '@scopelift/zeneth-contracts/artifacts/contracts/SwapBriber.sol/SwapBriber.json';
import { config } from 'config';
import { ModalContext } from './Modal';

const abi = [
  // Read-Only Functions
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',

  // Authenticated Functions
  'function transfer(address to, uint amount) returns (boolean)',
  'function approve(address spender, uint256 value) returns (boolean)',
];

const inputStyle = 'bg-gray-100 p-3 w-full block';

const ERC20Form = () => {
  const { account, library, chainId } = useWeb3React<Web3Provider>();
  const { tokenList: supportedTokens } = useContext(ModalContext);

  const [formState, setFormState] = useState<{
    token: TokenInfo | undefined;
    recipientAddress: string;
    amount: string;
    minerFee: string;
  }>({
    token: supportedTokens[0],
    recipientAddress: '0x1F9C65eB3749419A495C2984ebc057176A921D01',
    amount: '1000',
    minerFee: '100',
  });

  if (!library || !chainId) return null;
  if (!account) return <div>Please connect your wallet.</div>;

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.target.value;
    setFormState({
      ...formState,
      [e.target.name]: value,
    });
  };

  const doSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { token, recipientAddress, amount, minerFee } = formState;
    const erc20 = new Contract(token.address, abi);
    const { swapBriber, weth, uniswapRouter } = config.networks[chainId].addresses;
    const swapBriberContract = new Contract(swapBriber, SwapBriber.abi);
    const zenethRelayer = await ZenethRelayer.create(library, process.env.AUTH_PRIVATE_KEY as string);

    const bribeAmount = parseUnits('.1', 18).toString(); // In ETH
    const transferAmount = parseUnits(amount, token.decimals).toString();
    const relayAmount = parseUnits(minerFee, token.decimals).toString();

    const fragments = [
      {
        data: erc20.interface.encodeFunctionData('transfer', [recipientAddress, transferAmount]),
        gasLimit: hexlify(250000),
        to: erc20.address,
        value: '0x0',
      },
      {
        data: erc20.interface.encodeFunctionData('approve', [swapBriber, MaxUint256.toString()]),
        gasLimit: hexlify(250000),
        to: erc20.address,
        value: '0x0',
      },
      {
        data: swapBriberContract.interface.encodeFunctionData('swapAndBribe', [
          erc20.address, // token to swap
          relayAmount, // fee in tokens
          bribeAmount, // bribe amount in ETH. less than or equal to DAI from above
          uniswapRouter, // uniswap router address
          [erc20.address, weth], // path of swap
          '2000000000', // really big deadline
        ]),
        gasLimit: hexlify(250000),
        to: swapBriber,
        value: '0x0',
      },
    ];
    console.log(fragments);
    console.log(account);
    const signatures = await zenethRelayer.signBundle(account, fragments, library);
    console.log(signatures);
    const body = JSON.stringify({ txs: signatures, blocks: 10, chainId });
    const headers = { 'Content-Type': 'application/json' };
    const response = await fetch(config.relayUrl, { method: 'POST', body, headers });
    console.log('response: ', response);
    const json = await response.json();
    console.log('json: ', json);
  };

  const formGroup = 'my-2 flex flex-row items-center rounded';
  const label = 'w-24 block self-center flex-shrink-0';

  return (
    <div className="shadow-lg p-7 bg-gradient-to-br from-red-300 to-purple-400 rounded-lg">
      <form className="flex flex-col">
        <h1 className="text-2xl mb-7 text-gray-700">Gasless Token Transfer</h1>
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
          <input
            name="recipientAddress"
            value={formState.recipientAddress}
            className={inputStyle}
            onChange={handleChange}
          />
        </div>
        <div className={formGroup}>
          <label className={label}>Amount</label>
          <input name="amount" value={formState.amount} className={inputStyle} onChange={handleChange} />
          <div className="p-3 bg-gray-200">{formState.token?.symbol || ''}</div>
        </div>
        <div className={formGroup}>
          <label className={label}>Fee</label>
          <input name="minerFee" value={formState.minerFee} className={inputStyle} onChange={handleChange} />
          <div className="p-3 bg-gray-200">{formState.token?.symbol || ''}</div>
        </div>
        <button className="mt-5 p-3 bg-blue-100 rounded opacity-90 hover:opacity-100 text-lg" onClick={doSubmit}>
          Submit
        </button>
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
    <Listbox as="div" value={selectedToken} onChange={setToken} className="relative z-20">
      {({ open }) => (
        <>
          <Listbox.Button className={inputStyle + ' truncate'}>
            {selectedToken ? `${selectedToken.symbol as string} (${selectedToken.address as string})` : 'Select Token'}
            <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <SelectorIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </Listbox.Button>
          <Transition
            show={open}
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options
              static
              className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-56 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
            >
              {supportedTokens.map((token) => (
                <Listbox.Option key={token.address} value={token} as={Fragment}>
                  {({ active, selected }) => (
                    <li className={`w-full p-3 ${active ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
                      {/* {selected && <CheckIcon className="h-5 w-5 text-blue-500" />} */}
                      {token.symbol}
                      {selected ? (
                        <span
                          className={[
                            active ? 'text-white' : 'text-indigo-600',
                            'absolute inset-y-0 right-0 flex items-center pr-4',
                          ].join(' ')}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </li>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </>
      )}
    </Listbox>
  );
};

export default ERC20Form;
