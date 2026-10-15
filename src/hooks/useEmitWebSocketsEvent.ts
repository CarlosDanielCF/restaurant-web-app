import { useContext, useState, useRef } from 'react';
import { SocketContext } from '../context';
import {
  SocketResponse,
  SocketResponseData
} from '../models/socket-response.dto';
import {
  operationScope,
  pendingOperation,
  confirmOperation
} from '../api/pendingOperation';
import { useRestaurantStore } from '../pages/Private/Common/store/restaurantStore';
interface WebSocketOptions<TData> {
  onSuccess?: (resp: TData) => void;
  onError?: (resp: SocketResponse) => void;
}
export function useEmitWebSocketsEvent<TData, TVariables>(
  eventMessage: string,
  options?: WebSocketOptions<SocketResponseData<TData>>
) {
  const { socket, online } = useContext(SocketContext);
  const pending = useRef(false);
  const attempt = useRef(0);
  const [loading, setLoading] = useState(false);
  const mutate = async (
    data: TVariables,
    secondaryOptions?: WebSocketOptions<SocketResponseData<TData>>
  ) => {
    if (pending.current || !socket || !online) return;
    pending.current = true;
    setLoading(true);
    const current = ++attempt.current;
    const fail = (resp: SocketResponse) => {
      options?.onError?.(resp);
      secondaryOptions?.onError?.(resp);
    };
    try {
      const critical = ['create-order', 'add-order-detail'].includes(
        eventMessage
      );
      const intent = critical
        ? await pendingOperation(
            operationScope(useRestaurantStore.getState().restaurant?.id),
            eventMessage,
            data
          )
        : undefined;
      const suppliedKey = (data as { idempotencyKey?: string })?.idempotencyKey;
      const payload = intent
        ? { ...data, idempotencyKey: suppliedKey || intent.key }
        : data;
      const timeout = setTimeout(() => {
        if (attempt.current !== current) return;
        pending.current = false;
        setLoading(false);
        fail({
          ok: false,
          msg: 'Sin confirmación del servidor. Reintente la misma operación para consultar su resultado.'
        } as SocketResponse);
      }, 15000);
      socket.emit(eventMessage, payload, (resp: SocketResponseData<TData>) => {
        clearTimeout(timeout);
        // A late ACK must not unlock a newer attempt or repeat its callbacks.
        if (attempt.current !== current) return;
        pending.current = false;
        setLoading(false);
        if (resp.ok) {
          if (intent) confirmOperation(intent);
          options?.onSuccess?.(resp);
          secondaryOptions?.onSuccess?.(resp);
        } else fail(resp);
      });
    } catch {
      pending.current = false;
      setLoading(false);
      fail({
        ok: false,
        msg: 'No se pudo conservar la operación. Revise el almacenamiento del navegador antes de reintentar.'
      } as SocketResponse);
    }
  };
  return { mutate, isLoading: loading, isOnline: online };
}
