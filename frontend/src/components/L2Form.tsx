import { useState, Fragment, Dispatch } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { Listbox } from '@headlessui/react';
import { TokenInfo } from 'types';
import { Contract } from '@ethersproject/contracts';
import { MaxUint256 } from '@ethersproject/constants';
import { parseUnits } from '@ethersproject/units';
import { hexlify } from '@ethersproject/bytes';
// import { CheckIcon } from '@heroicons/react/solid';
import { ZenethRelayer } from '@scopelift/zeneth-js';
import SwapBriber from '@scopelift/zeneth-contracts/artifacts/contracts/SwapBriber.sol/SwapBriber.json';
import { config } from 'config';
const zkSyncAddress = '0xaBEA9132b05A70803a4E85094fD0e1800777fBEF';

const erc20abi = [
  // Read-Only Functions
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',

  // Authenticated Functions
  'function transfer(address to, uint amount) returns (boolean)',
  'function approve(address spender, uint256 value) returns (boolean)',
];

const zkSyncAbi = [
  // Read-Only Functions
  'function depositERC20(address _token, uint104 _amount, address _franklinAddr)',
];

const supportedTokens: TokenInfo[] = [
  {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    name: 'Dai',
    symbol: 'DAI',
    chainId: 1,
    decimals: 18,
  },
];

type l2Info = {
  name: string;
  address: string;
  abi: string[];
  encodeDeposit: ({
    amount,
    tokenAddress,
    recipient,
  }: {
    amount: string;
    tokenAddress: string;
    recipient: string;
  }) => string;
};

const supportedL2s: l2Info[] = [
  {
    name: 'zkSync',
    address: zkSyncAddress,
    abi: zkSyncAbi,
    encodeDeposit: ({ amount, tokenAddress, recipient }: { amount: string; tokenAddress: string; recipient: string }) =>
      new Contract(zkSyncAddress, zkSyncAbi).interface.encodeFunctionData('depositERC20', [
        tokenAddress,
        amount,
        recipient,
      ]),
  },
];

const inputStyle = 'bg-gray-100 p-3 w-full block';

const L2Form = () => {
  const { account, library, chainId } = useWeb3React<Web3Provider>();
  const [formState, setFormState] = useState<{
    token: TokenInfo | undefined;
    l2: l2Info | undefined;
    amount: string;
    minerFee: string;
  }>({
    token: supportedTokens[0],
    l2: supportedL2s[0],
    amount: '1',
    minerFee: '200',
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
    if (!formState.l2) throw new Error('token not set');
    const { token, l2, amount, minerFee } = formState;
    const erc20Contract = new Contract(token.address, erc20abi);
    const l2Contract = new Contract(l2.address, formState.l2.abi);
    console.log(process.env.AUTH_PRIVATE_KEY);
    const zenethRelayer = await ZenethRelayer.create(library, process.env.AUTH_PRIVATE_KEY as string);
    const { swapBriber, weth, uniswapRouter } = config.networks[chainId].addresses;
    const swapBriberContract = new Contract(swapBriber, SwapBriber.abi);
    const bribeAmount = parseUnits('0.1', 18).toString(); // in ETH
    const transferAmount = parseUnits(amount, token.decimals).toString();
    const feeAmount = parseUnits(minerFee, token.decimals).toString();
    const fragments = [
      {
        data: erc20Contract.interface.encodeFunctionData('approve', [l2Contract.address, MaxUint256.toString()]),
        gasLimit: hexlify(150000),
        to: erc20Contract.address,
        value: '0x0',
      },
      {
        data: l2.encodeDeposit({
          amount: transferAmount,
          tokenAddress: erc20Contract.address,
          recipient: account,
        }),
        gasLimit: hexlify(500000),
        to: l2Contract.address,
        value: '0x0',
      },
      {
        data: erc20Contract.interface.encodeFunctionData('approve', [swapBriber, MaxUint256.toString()]),
        gasLimit: hexlify(150000),
        to: erc20Contract.address,
        value: '0x0',
      },
      {
        data: swapBriberContract.interface.encodeFunctionData('swapAndBribe', [
          erc20Contract.address, // token to swap
          feeAmount, // fee in tokens
          bribeAmount, // bribe amount in ETH. less than or equal to DAI from above
          uniswapRouter, // uniswap router address
          [erc20Contract.address, weth], // path of swap
          '2000000000', // really big deadline
        ]),
        gasLimit: hexlify(500000),
        to: swapBriber,
        value: '0x0',
      },
    ];
    console.log(fragments);
    const signatures = await zenethRelayer.signBundle(account, fragments, library);
    console.log(signatures);
    const body = JSON.stringify({ txs: signatures, blocks: 50, chainId });
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
        <h1 className="text-2xl mb-7 text-gray-700">Gasless L2 Entry</h1>
        <div className={formGroup}>
          <label className={label}>Token</label>
          <TokenListbox
            selectedToken={formState.token}
            supportedTokens={supportedTokens}
            setToken={(token) => setFormState({ ...formState, token })}
          />
        </div>
        <div className={formGroup}>
          <label className={label}>L2</label>
          <L2Listbox
            selectedL2={formState.l2}
            supportedL2s={supportedL2s}
            setL2={(l2) => setFormState({ ...formState, l2 })}
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
    <Listbox as="div" value={selectedToken} onChange={setToken} className="relative text-left w-full">
      <Listbox.Button className={`text-left ${inputStyle}`}>
        {selectedToken ? `${selectedToken.symbol as string} (${selectedToken.address as string})` : 'Select Token'}
      </Listbox.Button>
      <Listbox.Options className="absolute mt-1 w-full z-20">
        {supportedTokens.map((token) => (
          <Listbox.Option key={token.address} value={token} as={Fragment}>
            {({ active, selected }) => (
              <li className={`w-full p-3 ${active ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
                {/* {selected && <CheckIcon className="h-5 w-5 text-blue-500 inline-block" />} */}
                {token.symbol}
              </li>
            )}
          </Listbox.Option>
        ))}
      </Listbox.Options>
    </Listbox>
  );
};

const L2Listbox = ({
  supportedL2s,
  selectedL2,
  setL2,
}: {
  supportedL2s: TokenInfo[];
  selectedL2: TokenInfo | undefined;
  setL2: Dispatch<TokenInfo>;
}) => {
  return (
    <Listbox as="div" value={selectedL2} onChange={setL2} className="relative text-left w-full">
      <Listbox.Button className={`text-left ${inputStyle}`}>
        {selectedL2 ? `${selectedL2.name as string} (${selectedL2.address as string})` : 'Select Token'}
      </Listbox.Button>
      <Listbox.Options className="absolute mt-1 w-full">
        {supportedL2s.map((l2) => (
          <Listbox.Option key={l2.address} value={l2} as={Fragment}>
            {({ active, selected }) => (
              <li className={`w-full p-3 ${active ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
                {/* {selected && <CheckIcon className="h-5 w-5 text-blue-500" />} */}
                {l2.name}
              </li>
            )}
          </Listbox.Option>
        ))}
      </Listbox.Options>
    </Listbox>
  );
};

export default L2Form;
