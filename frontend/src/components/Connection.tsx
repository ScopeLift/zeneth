import { useState, useEffect, useContext } from 'react';
import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React, UnsupportedChainIdError } from '@web3-react/core';
import { useEagerConnect, useInactiveListener } from 'hooks/react-web3';
import { network, injected } from 'helpers/connectors';
import { ModalContext } from 'components/Modal';
import { ToastContext } from 'components/Toast';
import { XIcon } from '@heroicons/react/solid';
import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from '@web3-react/injected-connector';

enum ConnectorNames {
  Network = 'Network',
  Injected = 'Metamask',
}

const connectorsByName: { [connectorName in ConnectorNames]: any } = {
  [ConnectorNames.Network]: network,
  [ConnectorNames.Injected]: injected,
};

function getErrorMessage(error: Error) {
  if (error instanceof NoEthereumProviderError) {
    return 'No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.';
  } else if (error instanceof UnsupportedChainIdError) {
    return "You're connected to an unsupported network. " + error.message;
  } else if (error instanceof UserRejectedRequestErrorInjected) {
    return 'Please authorize this website to access your Ethereum account.';
  } else {
    console.error(error);
    return 'An unknown error occurred. Check the console for more details.';
  }
}

const ConnectionModal = ({ props }) => {
  const { clearModal } = useContext(ModalContext);
  const { connector, chainId, activate, deactivate, error } = useWeb3React<Web3Provider>();
  const { activatingConnector, setActivatingConnector, triedEager } = props;

  return (
    <div className="pb-2">
      <div className="flex justify-between w-full bg-gray-200 p-3 font-semibold">
        <h2>Connect Wallet</h2>

        <XIcon className="opacity-50 hover:opacity-80 hover:cursor-pointer h-6 w-6" onClick={() => clearModal()} />
      </div>

      <div className="flex flex-col px-2">
        <div className="my-2">Choose provider and network:</div>
        {Object.keys(connectorsByName).map((connectorName) => {
          const currentConnector = connectorsByName[connectorName];
          const activating = currentConnector === activatingConnector;
          const connected = currentConnector === connector;
          const disabled = !triedEager || !!activatingConnector || connected || !!error;
          if (connectorName === 'Network') return <div></div>;
          return (
            <div className="flex bg-gray-100 mb-2 p-2 rounded items-center content-between" key={connectorName}>
              <button
                className={'mx-4 w-3/5 font-semibold ' + (connected ? 'border-green-300' : '')}
                onClick={async () => {
                  console.log(connected, activating, connectorName);
                  if (connected) return deactivate();
                  // if connector is injected, set the activating connector
                  if (!activating && connectorName === ConnectorNames.Injected) {
                    await activate(connectorsByName[connectorName]);
                  }
                }}
              >
                {connectorName}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Connection = () => {
  const { connector, library, chainId, account, activate, deactivate, active, error } = useWeb3React<Web3Provider>();
  const { setModal, clearModal } = useContext(ModalContext);
  const { setToast } = useContext(ToastContext);
  useEffect(() => {
    if (error) {
      console.log(error);
      setToast({
        type: 'error',
        content: getErrorMessage(error),
        timeout: 5000,
      });
    }
  }, [error]);

  // handle logic to eagerly connect to the injected ethereum provider, if it exists and has granted access already
  const triedEager = useEagerConnect();

  // handle logic to recognize the connector currently being activated
  const [activatingConnector, setActivatingConnector] = useState<any>();
  useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined);
    }
  }, [activatingConnector, connector]);

  // use network connector if wallet disconnected
  useEffect(() => {
    if (triedEager && !activatingConnector && !active && !connector) {
      setActivatingConnector(connectorsByName['Network']);
      activate(connectorsByName['Network']);
    }
  }, [triedEager, activatingConnector, active, connector]);

  // clear modal after successful connection
  useEffect(() => {
    if (active) clearModal();
  }, [active]);

  // handle logic to connect in reaction to certain events on the injected ethereum provider, if it exists
  useInactiveListener(!triedEager || !!activatingConnector);

  const showConnectionModal = () => {
    setModal({
      content: (
        <ConnectionModal
          props={{
            activatingConnector,
            setActivatingConnector,
            triedEager,
          }}
        />
      ),
      styleClass: 'sm:w-3/4 md:w-1/2 lg:w-1/3',
    });
  };

  return (
    <>
      <button className="flex items-center ml-4" onClick={() => showConnectionModal()}>
        <div
          className={
            'h-3 w-3 border-2 rounded-full mr-2 ' +
            (active && account ? 'bg-green-400' : activatingConnector ? 'bg-yellow-600' : 'bg-red-600')
          }
        ></div>

        {active && account ? (
          <span className="font-mono">{account}</span>
        ) : activatingConnector ? (
          'Activating...'
        ) : (
          'Connect Wallet'
        )}
      </button>
    </>
  );
};
