// https://medium.com/@aibolkussain/creating-toast-api-with-react-hooks-94e454379632

import React, { useCallback, useEffect, useState } from 'react';

let TOAST_ID = 0;
const TOAST_TIMEOUT = 3000;

const ToastStyles = () => {
  return (
    <style>
      {`
#toast-container {
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 320px;

  z-index: 9999999;
}

.message.is-toast {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

.message.is-fading {
  opacity: 0;
  transition: all 250ms linear;
}
      `}
    </style>
  );
};

const ToastContext = React.createContext(null);

const Toast = ({ children }) => {
  const [isFading, setFading] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setFading(true)
    }, TOAST_TIMEOUT)
  }, []);

  return (
    <article className={`message is-info is-toast ${isFading ? 'is-fading' : ''}`}>
      <div className="message-body">
        { children }
      </div>
    </article>
  )
}

export const ToastContainer = ({ toasts }) => {
  return (
    <div id="toast-container">
      {
        toasts.map(t => (
          <Toast key={t.id}>
            { t.content }
          </Toast>
        ))
      }
    </div>
  )
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback(id => {
    setToasts(toasts => toasts.filter(t => t.id !== id));
  }, [setToasts]);

  const addToast = useCallback(content => {
    const id = ++TOAST_ID;
    setToasts(toasts => [
      ...toasts,
      { id, content }
    ]);

    setTimeout(() => {
      removeToast(id)
    }, TOAST_TIMEOUT + 1000)
  }, [setToasts]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      <ToastStyles />
      <ToastContainer toasts={toasts} />
      { children }
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const toastHelpers = React.useContext(ToastContext);
  return toastHelpers;
}