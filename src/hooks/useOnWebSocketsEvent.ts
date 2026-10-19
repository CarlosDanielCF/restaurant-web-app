import { useContext, useEffect, useRef } from 'react';
import { SocketContext } from '../context/SocketContext';
import { SocketEvent } from '../models/socket-event.dto';
import { EventsOnSocket } from '../pages/Private/Orders/interfaces/events-sockets.interface';

export const useOnWebSocketsEvent = <T>(
  event: EventsOnSocket,
  callback: (socketEvent: SocketEvent<T>) => void
) => {
  const { socket } = useContext(SocketContext);
  const current = useRef(callback);
  current.current = callback;
  useEffect(() => {
    const listener = (socketEvent: SocketEvent<T>) =>
      current.current(socketEvent);
    socket?.on(event, listener);
    // Remove this subscription only: other views may observe the same event.
    return () => {
      socket?.off(event, listener);
    };
  }, [socket, event]);
};
