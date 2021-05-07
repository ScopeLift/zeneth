import { useEffect, useContext } from 'react';
import { createContext, useState } from 'react';

type ContextProps = {
  content: string;
  visible: boolean;
  timeout: number;
  type: 'success' | 'error';
  setToast: Function;
  clearToast: Function;
};

export const ToastContext = createContext<Partial<ContextProps>>({
  content: '',
  visible: false,
  timeout: 5000,
  type: 'error',
  setToast: () => {},
  clearToast: () => {},
});

export const WithToast = ({ children }) => {
  const [content, setContent] = useState<string>('');
  const [visible, setVisible] = useState(false);
  const [timeout, setTheTimeout] = useState(5000);
  const [type, setType] = useState<'success' | 'error'>('error');

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), timeout);
    return () => {
      setVisible(false);
      clearTimeout(timer);
    };
  }, [content, timeout, type]);

  const setToast = ({ type, content, timeout }: { type: 'success' | 'error'; content: string; timeout: number }) => {
    setContent(content);
    setVisible(true);
    setType(type);
    setTheTimeout(timeout || 5000);
  };

  const clearToast = () => {
    setVisible(false);
  };

  return (
    <ToastContext.Provider
      value={{
        content,
        visible,
        timeout,
        type,
        setToast,
        clearToast,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const Toast = () => {
  const { content, type, visible } = useContext(ToastContext);
  const styleClass = [
    'w-full p-5 mb-3 transition',
    type === 'success'
      ? 'bg-green-100 text-green-800 border border-green-800'
      : 'bg-red-100 text-red-800 border border-red-800',
    visible ? 'duration-0 opacity-100' : 'duration-500 opacity-0',
  ];

  return <div className={styleClass.join(' ')}>{content}</div>;
};
