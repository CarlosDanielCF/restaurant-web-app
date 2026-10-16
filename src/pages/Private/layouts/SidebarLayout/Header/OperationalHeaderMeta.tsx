import { useContext, useEffect, useState } from 'react';
import { SocketContext } from '@/context/SocketContext';
import { useRestaurantStore } from '../../../Common/store/restaurantStore';
export function OperationalHeaderMeta() {
  const zone = useRestaurantStore((s) => s.restaurant?.timeZone);
  const { online } = useContext(SocketContext);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className='pos-header-meta'>
      <time dateTime={now.toISOString()}>
        {now.toLocaleString('es-PE', {
          timeZone: zone || 'America/Lima',
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </time>
      <span className={online ? 'pos-online' : 'pos-offline'}>
        {online ? 'Conectado' : 'Sin conexión'}
      </span>
    </div>
  );
}
