import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      // Admin için socket bağlantısı
      const newSocket = io(process.env.REACT_APP_SERVER_URL || '', {
        withCredentials: true,
      });

      newSocket.on('connect', () => {
        console.log('Socket.IO bağlandı');
        setIsConnected(true);
        
        // Admin odasına katıl
        newSocket.emit('join-admin');
      });

      newSocket.on('disconnect', () => {
        console.log('Socket.IO bağlantısı kesildi');
        setIsConnected(false);
      });

      newSocket.on('siparis-geldi', (data) => {
        console.log('Yeni sipariş geldi:', data);
        // Burada bildirim gösterebiliriz
      });

      newSocket.on('siparis-guncellendi', (data) => {
        console.log('Sipariş güncellendi:', data);
        // Burada bildirim gösterebiliriz
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      // Müşteri için basit socket bağlantısı (gerekirse)
      const newSocket = io(process.env.REACT_APP_SERVER_URL || '', {
        withCredentials: true,
      });

      newSocket.on('connect', () => {
        console.log('Müşteri socket bağlandı');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Müşteri socket bağlantısı kesildi');
        setIsConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated]);

  const value = {
    socket,
    isConnected,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 