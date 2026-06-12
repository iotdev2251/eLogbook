import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (url) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const isDevServer = import.meta.env.DEV && window.location.port === '5173';
    const useTls = !isDevServer || window.location.protocol === 'https:';

    const socketInstance = io(url, {
      withCredentials: true,
      secure: useTls,
      rejectUnauthorized: false,
      autoConnect: true,
      reconnection: true,
    });

    socketRef.current = socketInstance;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);
    socketInstance.on('connect_error', onDisconnect);

    setSocket(socketInstance);
    setIsConnected(socketInstance.connected);

    return () => {
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
      socketInstance.off('connect_error', onDisconnect);
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [url]);

  const reconnect = useCallback(() => {
    const instance = socketRef.current;
    if (!instance) return;
    if (instance.connected) {
      instance.disconnect();
    }
    instance.connect();
  }, []);

  return { socket, isConnected, reconnect };
};
