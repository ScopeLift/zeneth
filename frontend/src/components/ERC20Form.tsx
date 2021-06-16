import { useState, useContext } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { TokenInfo } from 'types';
import { Contract } from '@ethersproject/contracts';
import { MaxUint256 } from '@ethersproject/constants';
import { parseUnits } from '@ethersproject/units';
import { hexlify } from '@ethersproject/bytes';
import { ZenethRelayer } from '@scopelift/zeneth-js';
import SwapBriber from '@scopelift/zeneth-contracts/artifacts/contracts/SwapBriber.sol/SwapBriber.json';
import { config } from 'config';
import { TokenSelect } from './TokenSelect';
import { BundleContext } from './BundleContext';
import { ModalContext } from './ModalContext';
import { NotificationContext } from './NotificationContext';

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
  const { sendBundle } = useContext(BundleContext);
  const { setModal, clearModal } = useContext(ModalContext);
  const { notify } = useContext(NotificationContext);
  const [formState, setFormState] = useState<{
    token: TokenInfo | undefined;
    recipientAddress: string;
    amount: string;
    minerFee: string;
  }>({
    token: undefined,
    recipientAddress: '',
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
    const zenethRelayer = await ZenethRelayer.create(library, process.env.AUTH_PRIVATE_KEY);

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
    setModal({
      content: (
        <div>
          Please use MetaMask to sign all {fragments.length} of the transactions that will be included in your bundle!
        </div>
      ),
    });
    try {
      const signatures = await zenethRelayer.signBundle(account, fragments, library);
      console.log(signatures);
      sendBundle(signatures);
    } catch (e) {
      notify({ type: 'error', heading: 'Error signing bundle', body: e.message });
    }
    clearModal();
  };

  const formGroup = 'my-2 flex flex-row items-center rounded';
  const label = 'w-24 block self-center flex-shrink-0';

  return (
    <div className="shadow-lg p-7 bg-gradient-to-br from-red-300 to-purple-400 rounded-lg">
      <form className="flex flex-col" spellCheck="false">
        <h1 className="text-2xl mb-7 text-gray-700">Gasless Token Transfer</h1>
        <div className={formGroup}>
          <label className={label}>Token</label>
          <TokenSelect
            selectedToken={formState.token}
            setToken={(token) => setFormState({ ...formState, token })}
            inputStyle={inputStyle}
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

export default ERC20Form;
