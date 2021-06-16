import { createContext, ReactNode, Fragment, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CheckIcon } from '@heroicons/react/outline';

type ContextProps = {
  clearModal: () => void;
  setModal: ({ content, canClose, style }: { content: ReactNode; canClose?: boolean; style?: string }) => void;
};

export const ModalContext = createContext<ContextProps>({
  clearModal: () => undefined,
  setModal: () => undefined,
});

export const WithModal = ({ children }: { children: ReactNode }) => {
  const [visible, setModalVisible] = useState(false);
  const [content, setModalContent] = useState<ReactNode>();
  const [canClose, setCanClose] = useState(true);
  const [style, setStyle] = useState('');
  const clearModal = () => {
    setModalVisible(false);
    setModalContent(<div></div>);
  };

  const setModal = ({
    content,
    canClose = true,
    style,
  }: {
    content: ReactNode;
    canClose?: boolean;
    style?: string;
  }) => {
    setModalContent(content);
    setModalVisible(true);
    setStyle(style);
    setCanClose(canClose);
  };

  return (
    <ModalContext.Provider
      value={{
        clearModal,
        setModal,
      }}
    >
      <Modal open={visible} styleClass={style} canClose={canClose} setOpen={setModalVisible}>
        {content}
      </Modal>
      {children}
    </ModalContext.Provider>
  );
};

export const Modal = ({
  children,
  open,
  setOpen,
  canClose = true,
  styleClass = 'w-1/2',
}: {
  children: ReactNode;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  canClose?: boolean;
  styleClass: string;
}) => {
  const focusRef = useRef(null);
  const onClose = canClose ? setOpen : () => {};
  return !children ? null : (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-10 inset-0 overflow-y-auto"
        initialFocus={focusRef}
        open={open}
        onClose={onClose}
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
              <button ref={focusRef} className="hidden"></button>
              {children}
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
