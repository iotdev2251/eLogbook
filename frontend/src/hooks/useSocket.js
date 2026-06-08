import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (url) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Node server listens on HTTPS (port 3011); match TLS when not on Vite dev server
    const isDevServer = import.meta.env.DEV && window.location.port === '5173';
    const useTls = !isDevServer || window.location.protocol === 'https:';

    const socketInstance = io(url, {
      withCredentials: true,
      secure: useTls,
      rejectUnauthorized: false,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('connect_error', () => {
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [url]);

  return { socket, isConnected };
};
