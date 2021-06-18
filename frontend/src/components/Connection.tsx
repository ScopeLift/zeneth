import { useState, useEffect, useContext } from 'react';
import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React, UnsupportedChainIdError } from '@web3-react/core';
import { useEagerConnect, useInactiveListener } from 'hooks/react-web3';
import { network, injected } from 'helpers/connectors';
import { ModalContext } from 'components/ModalContext';
import { ToastContext } from 'components/Toast';

import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from '@web3-react/injected-connector';

enum ConnectorNames {
  Network = 'Network',
  Injected = 'Metamask',
}

const connectorsByName: { [connectorName in ConnectorNames]: any } = {
  [ConnectorNames.Network]: { connector: network },
  [ConnectorNames.Injected]: { connector: injected, icon: '/static/images/metamask-fox.svg' },
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
  const { connector, activate, deactivate, error } = useWeb3React<Web3Provider>();
  const { activatingConnector, setActivatingConnector, triedEager } = props;

  return (
    <div className="pb-2">
      <div className="flex flex-col px-2 justify-center items-center">
        <div className="my-2 mx-auto">Choose your web3 provider:</div>
        {Object.keys(connectorsByName).map((connectorName) => {
          const { connector: currentConnector, icon } = connectorsByName[connectorName];
          console.log(connectorName);
          console.log(currentConnector);
          const activating = currentConnector === activatingConnector;
          const connected = currentConnector === connector;
          const disabled = !triedEager || !!activatingConnector || connected || !!error;
          if (connectorName === 'Network') return <div key={connectorName}></div>;
          return (
            <div key={connectorName} className="flex mb-2 p-2 rounded items-center content-between">
              <button
                type="button"
                className={`inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 ${
                  connected ? 'bg-green-100' : 'bg-white'
                } hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                onClick={async () => {
                  console.log(connected, activating, connectorName);
                  if (connected) return deactivate();
                  // if connector is injected, set the activating connector
                  if (!activating && connectorName === ConnectorNames.Injected) {
                    await activate(currentConnector);
                  }
                }}
              >
                <img src={icon} className="mr-4" /> {connectorName}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Connection = () => {
  const { connector, account, activate, active, error } = useWeb3React<Web3Provider>();
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
      setActivatingConnector(connectorsByName['Network'].connector);
      activate(connectorsByName['Network'].connector);
    }
  }, [triedEager, activatingConnector, active, connector]);

  // clear modal after successful connection
  useEffect(() => {
    if (active) clearModal();
  }, [active, connector]);

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
      style: 'sm:w-3/4 md:w-1/2 lg:w-1/3',
    });
  };

  return (
    <>
      <button className="flex items-center w-full h-full px-4 py-2" onClick={() => showConnectionModal()}>
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
