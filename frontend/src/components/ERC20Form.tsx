import { useState, Fragment, Dispatch } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { Listbox } from '@headlessui/react';
import { TokenInfo } from 'types';
import { Contract } from '@ethersproject/contracts';
import { MaxUint256 } from '@ethersproject/constants';
import { parseUnits } from '@ethersproject/units';
import { hexlify } from '@ethersproject/bytes';
import { CheckIcon } from '@heroicons/react/solid';
import { ZenethRelayer } from '@scopelift/zeneth-js';
import SwapBriber from '@scopelift/zeneth-contracts/artifacts/contracts/SwapBriber.sol/SwapBriber.json';
import { config } from 'config';

const abi = [
  // Read-Only Functions
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',

  // Authenticated Functions
  'function transfer(address to, uint amount) returns (boolean)',
  'function approve(address spender, uint256 value) returns (boolean)',
];

const supportedTokens: TokenInfo[] = [
  {
    address: '0xCdC50DB037373deaeBc004e7548FA233B3ABBa57',
    name: 'DAI',
    symbol: 'DAI',
    chainId: 5,
    decimals: 18,
  },
];

const inputStyle = 'bg-gray-200 rounded p-3 w-full block';

const ERC20Form = () => {
  const { account, library, chainId } = useWeb3React<Web3Provider>();
  const [formState, setFormState] = useState<{
    token: TokenInfo | undefined;
    recipientAddress: string;
    amount: string;
    minerFee: string;
  }>({
    token: supportedTokens[0],
    recipientAddress: '0x1F9C65eB3749419A495C2984ebc057176A921D01',
    amount: parseUnits('1000', 18).toString(),
    minerFee: parseUnits('100', 18).toString(),
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
    // if (!formState.token?.address) throw new Error('token not set');
    const erc20 = new Contract(formState.token.address, abi);
    console.log(process.env.AUTH_PRIVATE_KEY);
    const zenethRelayer = await ZenethRelayer.create(library, process.env.AUTH_PRIVATE_KEY as string);
    const { swapBriber, weth, uniswapRouter } = config.networks[chainId].addresses;
    const swapBriberContract = new Contract(swapBriber, SwapBriber.abi);
    const bribeAmount = parseUnits('.1', 18);
    const fragments = [
      {
        data: erc20.interface.encodeFunctionData('transfer', [formState.recipientAddress, formState.amount.toString()]),
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
          formState.minerFee, // fee in tokens
          bribeAmount.toString(), // bribe amount in ETH. less than or equal to DAI from above
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
    const signatures = await zenethRelayer.signBundle(account as string, fragments, library);
    console.log(signatures);
    // const bundlePromises = await zenethRelayer.sendBundle(signatures, 10);
    const body = JSON.stringify({ txs: signatures, blocks: 10, chainId });
    const headers = { 'Content-Type': 'application/json' };
    const response = await fetch(config.relayUrl, { method: 'POST', body, headers });
    console.log('response: ', response);
    const json = await response.json();
    console.log('json: ', json);
  };

  const formGroup = 'my-2 flex flex-row';
  const label = 'w-28 block self-center';
  return (
    <div className="border-green-500 border-solid border-2 drop-shadow-sm p-3">
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
        </div>
        <div className={formGroup}>
          <label className={label}>Fee</label>
          <input name="minerFee" value={formState.minerFee} className={inputStyle} onChange={handleChange} />
        </div>
        <button className="p-3 bg-gradient-to-r from-green-200 to-purple-200 rounded" onClick={doSubmit}>
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

export default ERC20Form;
