/* This example requires Tailwind CSS v2.0+ */
import { Fragment, useState, ReactNode, createContext } from 'react';
import { Transition } from '@headlessui/react';
import { CheckCircleIcon, InformationCircleIcon, ExclamationCircleIcon } from '@heroicons/react/outline';
import { XIcon } from '@heroicons/react/solid';

type Notification = { heading: string; body: string; type?: 'info' | 'success' | 'error' };

type ContextProps = {
  notify: ({ heading, body, type }: Notification) => void;
  clearNotifications: () => void;
};

export const NotificationContext = createContext<ContextProps>({
  notify: ({ heading, body, type }: Notification) => {},
  clearNotifications: () => {},
});

export const WithNotifications = ({ children }: { children: ReactNode }) => {
  const maxNotifications = 5;
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const deleteNotification = (i) => setNotifications(notifications.filter((_, n) => n !== i));

  const clearNotifications = () => setNotifications([]);

  return (
    <NotificationContext.Provider
      value={{
        notify: (notification: Notification) =>
          setNotifications((prevNotifications) => [
            ...prevNotifications.filter((_, i) => prevNotifications.length - i < maxNotifications),
            { show: true, ...notification },
          ]),
        clearNotifications,
      }}
    >
      {children}
      {/* Global notification live region, render this permanently at the end of the document */}
      <div
        aria-live="assertive"
        className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start"
      >
        <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
          {notifications &&
            notifications.map((notification, i) => (
              <NotificationItem key={i} {...notification} show={true} setShow={() => deleteNotification(i)} />
            ))}
        </div>
      </div>
    </NotificationContext.Provider>
  );
};

const NotificationItem = ({ heading, body, show = true, setShow, type = 'info' }) => {
  const icons = {
    info: <InformationCircleIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />,
    success: <CheckCircleIcon className="h-6 w-6 text-green-400" aria-hidden="true" />,
    error: <ExclamationCircleIcon className="h-6 w-6 text-red-400" aria-hidden="true" />,
  };
  const icon = icons[type];
  return (
    <Transition
      show={show}
      as={Fragment}
      enter="transform ease-out duration-300 transition"
      enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enterTo="translate-y-0 opacity-90 sm:translate-x-0"
      leave="transition ease-in duration-100"
      leaveFrom="opacity-90"
      leaveTo="opacity-0"
    >
      <div className="max-w-sm w-full bg-white opacity-90 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">{icon}</div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-gray-900">{heading}</p>
              <p className="mt-1 text-sm text-gray-500">{body}</p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => {
                  setShow(false);
                }}
              >
                <span className="sr-only">Close</span>
                <XIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  );
};
