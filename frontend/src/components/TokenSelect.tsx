import { TokenInfo } from 'types';
import { Listbox, Transition } from '@headlessui/react';
import { Dispatch, Fragment } from 'react';
import { SelectorIcon, CheckIcon } from '@heroicons/react/solid';

export const TokenSelect = ({
  supportedTokens,
  selectedToken,
  setToken,
  inputStyle,
}: {
  supportedTokens: TokenInfo[];
  selectedToken: TokenInfo | undefined;
  setToken: Dispatch<TokenInfo>;
  inputStyle: string;
}) => {
  return (
    <Listbox as="div" value={selectedToken} onChange={setToken} className="relative z-20 w-full">
      {({ open }) => (
        <>
          <Listbox.Button className={inputStyle}>
            {selectedToken ? (
              <div className="flex items-center mr-4">
                <img src={selectedToken.logoURI} alt="" className="flex-shrink-0 h-6 w-6 rounded-full mr-2" />
                <div className="mr-2">{selectedToken.symbol}</div>
                <div className="truncate text-gray-400 w-72 text-xs font-mono">{selectedToken.address}</div>
              </div>
            ) : (
              'Select Token'
            )}
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
              {supportedTokens.map((token: TokenInfo) => (
                <Listbox.Option key={token.address} value={token} as={Fragment}>
                  {({ active, selected }) => (
                    <div
                      className={`flex items-center w-full p-3 cursor-pointer ${
                        active ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
                      }`}
                    >
                      <img src={token.logoURI} alt="" className="flex-shrink-0 h-6 w-6 rounded-full mr-2" />
                      <div className="mr-2">{token.symbol}</div>
                      <div className="truncate text-gray-400 text-xs font-mono"> {token.address}</div>
                      {selected ? (
                        <span
                          className={[active ? 'text-white' : 'text-indigo-600', 'flex items-right flex-shrink'].join(
                            ' '
                          )}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </div>
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
