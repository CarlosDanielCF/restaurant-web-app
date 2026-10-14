import { useContext, useState, useRef } from 'react';
import { SocketContext } from '../context';
import {
  SocketResponse,
  SocketResponseData
} from '../models/socket-response.dto';

interface WebSocketOptions<TData> {
  onSuccess?: (resp: TData) => void;
  onError?: (resp: SocketResponse) => void;
}

/**
 * Hook to use websockets
 * @version v1.0 24-12-2023
 */
export function useEmitWebSocketsEvent<TData, TVariables>(
  eventMessage: string,
  options?: WebSocketOptions<SocketResponseData<TData>>
) {
  const { socket, online } = useContext(SocketContext);
  const pending = useRef(false);
  const retry = useRef<{signature:string;key:string}>();
  const [loading, setLoading] = useState(false);

  const mutate = async (
    data: TVariables,
    secondaryOptions?: WebSocketOptions<SocketResponseData<TData>>
  ) => {
    if (pending.current || !socket || !online) return;
    pending.current = true;
    const signature=JSON.stringify(data);
    const key=retry.current?.signature===signature?retry.current.key:crypto.randomUUID();
    retry.current={signature,key};
    const payload=['create-order','add-order-detail'].includes(eventMessage)?{...data,idempotencyKey:key}:data;
    setLoading(true);
    const timeout=setTimeout(()=>{pending.current=false;setLoading(false);options?.onError?.({ok:false,msg:'Sin confirmación del servidor. Reintente la misma operación para consultar su resultado.'} as SocketResponse);},15000);

    socket.emit(eventMessage, payload, (resp: SocketResponseData<TData>) => {
      clearTimeout(timeout);pending.current=false;
      setLoading(false);

      if (resp.ok) {
        retry.current=undefined;
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
