import { store } from '@/redux/store';
import { Manager, Socket } from 'socket.io-client';
import { useEffect, useState, useCallback } from 'react';
import { useRestaurantStore } from '@/pages/Private/Common/store/restaurantStore';

/**
 * @author Santiago Quirumbay
 * @version 1.1 13-04-2025 Add restaurantId to extraHeaders
 */
export const useSocket = (serverPath: string) => {
  const [online, setOnline] = useState<boolean | undefined>(false);
  const { restaurant } = useRestaurantStore((state) => state);

  const [socket, setSocket] = useState<Socket | null>(null);

  const conectarSocket = useCallback(() => {
    const token = localStorage.getItem('token') || '';

    const manager = new Manager(serverPath, {
      extraHeaders: {
        authentication: token,
        restaurantId: restaurant?.id || ''
      }
    });

    const socketTemp = manager.socket('/');

    const emit = socketTemp.emit.bind(socketTemp);
    socketTemp.emit = ((event: string, ...args: unknown[]) => {
      if (['create-order','add-order-detail','update-order','update-order-detail'].includes(event) && args[0] && typeof args[0] === 'object') {
        const data: Record<string, unknown> = {...args[0]};
        const state = store.getState().orders;
        const id = data.orderId || data.id;
        const order = state.activeOrder?.id === id ? state.activeOrder : state.orders.find(item=>item.id===id);
        if (event !== 'create-order') data.expectedVersion ??= order?.version;
        if (['create-order','add-order-detail'].includes(event)) data.idempotencyKey ??= crypto.randomUUID();
        args[0]=data;
      }
      return emit(event,...args);
    }) as typeof socketTemp.emit;
    setSocket(previous => { previous?.disconnect(); return socketTemp; });
  }, [serverPath, restaurant?.id]);

  const desconectarSocket = useCallback(() => {
    socket?.disconnect();
  }, [socket]);

  useEffect(() => {
    setOnline(socket?.connected);
  }, [socket]);

  useEffect(() => {
    socket?.on('connect', () => {
      setOnline(true);
    });
  }, [socket]);

  useEffect(() => {
    socket?.on('disconnect', () => {
      setOnline(false);
    });
  }, [socket]);

  return {
    socket,
    online,
    conectarSocket,
    desconectarSocket
  };
};
