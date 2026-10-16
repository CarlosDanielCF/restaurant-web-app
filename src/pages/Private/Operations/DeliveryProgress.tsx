// Read-only presentation of the existing dispatch state; payment is never inferred.
export function DeliveryProgress({
  status,
  takeaway
}: {
  status: string;
  takeaway: boolean;
}) {
  const steps = takeaway
    ? [
        ['PREPARING', 'Preparación'],
        ['READY', 'Retiro'],
        ['DELIVERED', 'Entregado']
      ]
    : [
        ['PREPARING', 'Preparación'],
        ['READY', 'Despacho'],
        ['DISPATCHED', 'Despachado'],
        ['IN_TRANSIT', 'En camino'],
        ['DELIVERED', 'Entregado']
      ];
  return (
    <ol className='pos-delivery-progress' aria-label='Estado de entrega'>
      {steps.map(([key, label]) => (
        <li key={key} aria-current={status === key ? 'step' : undefined}>
          <span />
          {label}
        </li>
      ))}
    </ol>
  );
}
