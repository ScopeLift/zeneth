import { useState, useContext, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { TokenInfo } from 'types';
import { Contract } from '@ethersproject/contracts';
import { MaxUint256 } from '@ethersproject/constants';
import { parseUnits, formatUnits, parseEther } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import { hexlify, isHexString } from '@ethersproject/bytes';
import { ZenethRelayer, estimateFee } from '@scopelift/zeneth-js';
import SwapBriber from '@scopelift/zeneth-contracts/artifacts/contracts/SwapBriber.sol/SwapBriber.json';
import { config } from 'config';
import { TokenSelect } from './TokenSelect';
import { BundleContext } from './BundleContext';
import { ModalContext } from './ModalContext';
import { NotificationContext } from './NotificationContext';
import { LightningBoltIcon } from '@heroicons/react/outline';
import { ExclamationCircleIcon } from '@heroicons/react/solid';

const abi = [
  // Read-Only Functions
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',

  // Authenticated Functions
  'function transfer(address to, uint amount) returns (boolean)',
  'function approve(address spender, uint256 value) returns (boolean)',
];

const inputBaseStyle =
  'bg-gray-100 p-3 w-full block focus:outline-none focus:ring-indigo-600 focus:border-indigo-600 rounded-md';

// 'block w-full pr-10 border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md';

const ERC20Form = () => {
  const { account, library, chainId } = useWeb3React<Web3Provider>();
  const { sendBundle, bundleStatus } = useContext(BundleContext);
  const { setModal, clearModal } = useContext(ModalContext);
  const { notify } = useContext(NotificationContext);
  const [userTokenBalance, setUserTokenBalance] = useState<BigNumber>(BigNumber.from(3000000));
  const [bribeInTokens, setBribeInTokens] = useState<BigNumber>();
  const [bribeInEth, setBribeInEth] = useState<BigNumber>();
  const [showAddressValidationError, setShowAddressValidationError] = useState<boolean>(false);
  const [showAmountValidationError, setShowAmountValidationError] = useState<boolean>(false);

  const [formState, setFormState] = useState<{
    token: TokenInfo | undefined;
    recipientAddress: string;
    amount: string;
    bribeMultiplier: number;
  }>({
    token: undefined,
    recipientAddress: '',
    amount: '',
    bribeMultiplier: config.flashbotsPremiumMultipliers[0],
  });

  useEffect(() => {
    if (!formState.token?.address) return;
    const getBalance = async () => {
      console.log(formState.token.address);
      console.log(abi);
      console.log(account);
      const contract = new Contract(formState.token.address, abi, library);
      const balance = await contract.balanceOf(account);
      setUserTokenBalance(balance);
    };
    getBalance();
  }, [formState.token?.address]);

  useEffect(() => {
    const { token, bribeMultiplier } = formState;
    if (!token) return;
    const getBribe = async () => {
      const { bribeInTokens, bribeInEth } = await estimateFee({
        tokenAddress: token.address,
        tokenDecimals: token.decimals,
        bundleGasLimit: Object.values(token.gasEstimates).reduce((x: number, y: number) => x + y),
        flashbotsPremiumMultiplier: bribeMultiplier,
      });
      const addRelayerPad = (bn: BigNumber) => bn.mul((config.relayerFeePadding + 1) * 100).div(100);

      setBribeInTokens(addRelayerPad(bribeInTokens));
      setBribeInEth(bribeInEth);
    };
    getBribe();
  }, [formState.token?.address, formState.bribeMultiplier]);

  if (!library || !chainId) return null;
  if (!account) return <div>Please connect your wallet.</div>;

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.target.value;
    setFormState({
      ...formState,
      [e.target.name]: value,
    });
  };

  const validateAddress = (e) => {
    if (!isHexString(formState.recipientAddress) || formState.recipientAddress.length !== 42) {
      setShowAddressValidationError(true);
    } else {
      setShowAddressValidationError(false);
    }
  };

  const validateAmount = (e) => {
    if (
      +formState.amount + +formatUnits(bribeInTokens, formState.token.decimals) >
      +formatUnits(userTokenBalance, formState.token.decimals)
    ) {
      setShowAmountValidationError(true);
    } else {
      setShowAmountValidationError(false);
    }
  };

  const doSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { token, recipientAddress, amount } = formState;
    const erc20 = new Contract(token.address, abi);
    const { swapBriber, weth, uniswapRouter } = config.networks[chainId].addresses;
    const swapBriberContract = new Contract(swapBriber, SwapBriber.abi);
    const zenethRelayer = await ZenethRelayer.create(library, process.env.AUTH_PRIVATE_KEY);
    const transferAmount = parseUnits(amount, token.decimals).toString();
    console.log('bribe in tokens ', bribeInTokens.toString(), '\nbribe in eth, ', bribeInEth.toString());
    const fragments = [
      {
        data: erc20.interface.encodeFunctionData('transfer', [recipientAddress, transferAmount]),
        gasLimit: hexlify(token.gasEstimates.transfer),
        to: erc20.address,
        value: '0x0',
      },
      {
        data: erc20.interface.encodeFunctionData('approve', [swapBriber, MaxUint256.toString()]),
        gasLimit: hexlify(token.gasEstimates.approve),
        to: erc20.address,
        value: '0x0',
      },
      {
        data: swapBriberContract.interface.encodeFunctionData('swapAndBribe', [
          erc20.address, // token to swap
          bribeInTokens, // fee in tokens
          chainId === 5 ? bribeInEth.div(6).mul(5) : bribeInEth, // bribe amount in ETH. less than or equal to DAI from above
          uniswapRouter, // uniswap router address
          [erc20.address, weth], // path of swap
          '2000000000', // really big deadline
        ]),
        gasLimit: hexlify(token.gasEstimates.swapAndBribe),
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
  const label = 'w-24 text-sm block self-center flex-shrink-0';
  const submitDisabled = showAddressValidationError || showAmountValidationError || bundleStatus === 'pending';
  return (
    <div className="shadow-lg p-12 bg-gradient-to-br from-purple-100 via-red-100 to-transparent rounded-lg">
      <form className="flex flex-col" spellCheck="false">
        <h1 className="text-2xl mb-7 text-gray-700 font-bold">Gasless Token Transfer</h1>
        <div className={formGroup}>
          <label className={label}>Token</label>
          <TokenSelect
            selectedToken={formState.token}
            setToken={(token) => setFormState({ ...formState, token })}
            inputStyle={inputBaseStyle}
          />
        </div>
        <div className={formGroup}>
          <label className={label}>Recipient</label>
          <div className="mt-1 relative rounded-md shadow-sm w-full">
            <input
              name="recipientAddress"
              placeholder="0x123...def"
              value={formState.recipientAddress}
              className={`${inputBaseStyle} ${showAddressValidationError ? 'border-red-300 text-red-900' : ''}`}
              onChange={handleChange}
              onBlur={validateAddress}
            />{' '}
            {showAddressValidationError && (
              <p className="mt-1 mb-2 text-sm text-red-600" id="email-error">
                Please enter a valid Ethereum address.
              </p>
            )}
          </div>
        </div>
        <div className={formGroup}>
          <label className={label}>Amount</label>
          <div className="mt-1 relative rounded-md shadow-sm w-full">
            <div className="flex">
              <input
                placeholder="100"
                name="amount"
                value={formState.amount}
                className={`${inputBaseStyle} ${showAmountValidationError ? 'border-red-300 text-red-900' : ''}`}
                onChange={handleChange}
                onBlur={validateAmount}
              />
              <div className="p-3 bg-gray-200">{formState.token?.symbol || ''}</div>
            </div>
            {showAmountValidationError && (
              <p className="mt-1 mb-2 text-sm text-red-600" id="email-error">
                Your balance of {formatUnits(userTokenBalance, formState.token.decimals)} {formState.token.symbol} is
                lower than total.
              </p>
            )}
          </div>
        </div>
        <div className={formGroup}>
          <label className={label}>Miner Incentive Multiplier</label>
          <span className="relative z-0 inline-flex shadow-sm rounded-md">
            {config.flashbotsPremiumMultipliers.map((multiplier) => {
              const active = multiplier === formState.bribeMultiplier;
              return (
                <button
                  key={multiplier}
                  type="button"
                  onClick={() => setFormState({ ...formState, bribeMultiplier: multiplier })}
                  className={`relative mr-2 rounded-md inline-flex items-center px-4 py-2 border border-gray-300 bg-white ${
                    active ? 'border-indigo-600 text-indigo-600' : 'border-gray-300'
                  } font-medium text-gray-700 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
                >
                  {`${multiplier}x`}
                </button>
              );
            })}
          </span>
        </div>
        <div className={formGroup}>
          <label className={label}>Fee</label>
          <div className="border border-gray-200 bg-white bg-opacity-40 rounded-md py-2 px-4">
            {bribeInTokens ? formatUnits(bribeInTokens, formState.token.decimals) : undefined}{' '}
            {formState.token?.symbol || ''}
          </div>
        </div>
        <div className={formGroup}>
          <label className={label + ' font-semibold'}>Total</label>
          <div className="border border-gray-200 font-semibold bg-white bg-opacity-40 rounded-md py-2 px-4">
            {bribeInTokens ? +formatUnits(bribeInTokens, formState.token.decimals) + +formState.amount : undefined}{' '}
            {formState.token?.symbol || ''}
          </div>
        </div>
        <button
          type="button"
          className={`group mx-auto mt-5 inline-flex justify-center items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            submitDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 '
          }`}
          disabled={submitDisabled}
          onClick={doSubmit}
        >
          {bundleStatus === 'pending' ? (
            <>
              Processing
              <svg
                className="animate-spin ml-3 -mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </>
          ) : (
            <>
              Submit
              <LightningBoltIcon
                className={`ml-3 -mr-1 h-5 w-5 ${submitDisabled ? '' : 'group-hover:text-yellow-400'}`}
                aria-hidden="true"
              />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ERC20Form;
