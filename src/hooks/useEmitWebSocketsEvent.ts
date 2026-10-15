import { useContext, useState } from 'react';
import { SocketContext } from '../context';
import {
  SocketResponse,
  SocketResponseData
} from '../models/socket-response.dto';

interface WebSocketOptions<TData> {
  onSuccess?: (resp: TData) => void;
  onError?: (resp: SocketResponse) => void;
}

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Hook to use websockets
 * @version v1.0 24-12-2023
 */
export function useEmitWebSocketsEvent<TData, TVariables>(
  eventMessage: string,
  options?: WebSocketOptions<SocketResponseData<TData>>
) {
  const { socket, online } = useContext(SocketContext);
  const [loading, setLoading] = useState(false);

  const mutate = async (
    data: TVariables,
    secondaryOptions?: WebSocketOptions<SocketResponseData<TData>>
  ) => {
    setLoading(true);

    let payload: any = data;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      if (
        ['create-order', 'add-order-detail'].includes(eventMessage) &&
        !(data as any).idempotencyKey
      ) {
        payload = { ...data, idempotencyKey: generateUUID() };
      }
    }

    socket?.emit(eventMessage, payload, (resp: SocketResponseData<TData>) => {
      setLoading(false);

      if (resp.ok) {
        options?.onSuccess?.(resp);
        secondaryOptions?.onSuccess?.(resp);
      } else {
        options?.onError?.(resp);
        secondaryOptions?.onError?.(resp);
      }
    });
  };

  return {
    mutate,
    isLoading: loading,
    isOnline: online
  };
}
