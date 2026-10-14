export interface InternalDocument {
  id: string;
  sha256: string;
  snapshot: {
    label: string;
    disclaimer: string;
    kind: string;
    emittedAt: string;
    restaurant: {
      name: string;
      logo: string | null;
      currency: string;
      timeZone: string;
    };
    people: { id: string; name: string }[];
    tables: { name: string; releasedAt: string | null }[];
    account: {
      id: string;
      modality: string;
      responsibleUserId: string;
      paymentStatus: string;
      notes: string;
    };
    lines: {
      id: string;
      name: string;
      kind: string;
      beneficiaryUserId?: string;
      quantity: string;
      presentation?: { name: string };
      modifiers?: { name: string }[];
      components?: { name: string }[];
      portionKind?: string;
      availabilityUnitsPerItem?: string;
      originalUnitPrice: string;
      appliedUnitPrice: string;
      subtotal: string;
      status: string;
      notes: string;
    }[];
    discounts: { id: string; lineId: string; amount: string; reason: string }[];
    payments: {
      id: string;
      collectorId: string;
      confirmedAt: string;
      method: string;
      appliedAmount: string;
      receivedAmount: string;
      changeAmount: string;
      refunded: string;
    }[];
    refunds: { id: string; amount: string; method: string; reason: string }[];
    tips: {
      id: string;
      kind: string;
      amount: string;
      beneficiaryUserId: string;
      paidOut: string;
    }[];
    totals: {
      grossTotal: string;
      discountTotal: string;
      total: string;
      balance: string;
      debtBalance: string;
      paid: boolean;
    };
  };
}
const modes: Record<string, string> = {
  TABLE: 'MESA',
  TAKE_AWAY: 'PARA LLEVAR',
  OWN_DELIVERY: 'DELIVERY PROPIO',
  EXTERNAL_COURIER: 'COURIER EXTERNO'
};
export function DocumentView({
  document: doc,
  thermal = false
}: {
  document: InternalDocument;
  thermal?: boolean;
}) {
  const s = doc.snapshot,
    person = (id: string) => s.people.find((p) => p.id === id)?.name || id;
  return (
    <article className={'internal-document ' + (thermal ? 'thermal' : '')}>
      <h1>{s.label}</h1>
      <h2>{s.restaurant.name}</h2>
      {s.restaurant.logo && (
        <img
          src={s.restaurant.logo}
          alt='Logo histórico del restaurante'
          style={{ maxWidth: 100, maxHeight: 100 }}
        />
      )}
      <h3>
        {s.kind === 'ACCOUNT'
          ? 'Cuenta de atención'
          : 'Ticket interno de pagos registrados'}
      </h3>
      <p>
        Documento: {doc.id}
        <br />
        Atención: {s.account.id}
        <br />
        {modes[s.account.modality]}{' '}
        {s.tables
          .filter((t) => !t.releasedAt)
          .map((t) => t.name)
          .join(' + ') ||
          (s.tables.length
            ? ' · mesas históricas: ' + s.tables.map((t) => t.name).join(' + ')
            : '')}
        <br />
        {new Date(s.emittedAt).toLocaleString('es-PE', {
          timeZone: s.restaurant.timeZone
        })}{' '}
        ({s.restaurant.timeZone})<br />
        Responsable: {person(s.account.responsibleUserId)}
        <br />
        Moneda: {s.restaurant.currency}
      </p>
      <p>{s.account.notes}</p>
      <table>
        <thead>
          <tr>
            <th>Producto / cantidad</th>
            <th>Original</th>
            <th>Aplicado</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {s.lines.map((l) => (
            <tr key={l.id}>
              <td>
                {l.quantity} × {l.name}
                <br />
                {l.status === 'CANCELLED'
                  ? 'CANCELADO'
                  : l.kind === 'STAFF'
                    ? 'PERSONAL · ' + person(l.beneficiaryUserId || '')
                    : l.kind === 'COURTESY'
                      ? 'CORTESÍA'
                      : ''}
                <br />
                {l.presentation?.name && (
                  <>
                    {l.presentation.name}
                    <br />
                  </>
                )}
                {!!l.modifiers?.length && (
                  <>
                    {l.modifiers.map((m) => m.name).join(', ')}
                    <br />
                  </>
                )}
                {!!l.components?.length && (
                  <>
                    Incluidos: {l.components.map((c) => c.name).join(', ')}
                    <br />
                  </>
                )}
                {l.portionKind === 'SPECIAL' && (
                  <>
                    Porción especial
                    <br />
                  </>
                )}
                {l.notes}
              </td>
              <td>{l.originalUnitPrice}</td>
              <td>{l.appliedUnitPrice}</td>
              <td>{l.subtotal}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {s.discounts.length > 0 && (
        <>
          <h3>Descuentos registrados</h3>
          {s.discounts.map((d) => (
            <p key={d.id}>
              {s.lines.find((l) => l.id === d.lineId)?.name}: {d.amount} ·{' '}
              {d.reason}{' '}
              {s.lines.find((l) => l.id === d.lineId)?.status === 'CANCELLED'
                ? '(inactivo por cancelación)'
                : ''}
            </p>
          ))}
        </>
      )}
      <p>
        Consumo activo: {s.totals.grossTotal}
        <br />
        Descuentos activos: {s.totals.discountTotal}
        <br />
        <strong>Total consumo: {s.totals.total}</strong>
      </p>
      <h3>Pagos registrados</h3>
      {!s.payments.length && <p>Sin pagos registrados</p>}
      {s.payments.map((p) => (
        <p key={p.id}>
          {p.method}: aplicado {p.appliedAmount}
          {p.method === 'CASH'
            ? ` · recibido ${p.receivedAmount} · vuelto ${p.changeAmount}`
            : ''}
          <br />
          Cobrador: {person(p.collectorId)} ·{' '}
          {new Date(p.confirmedAt).toLocaleString('es-PE', {
            timeZone: s.restaurant.timeZone
          })}
        </p>
      ))}
      {s.refunds.map((r) => (
        <p key={r.id}>
          Reembolso registrado: {r.amount} · {r.method} · {r.reason}
        </p>
      ))}
      <h3>
        Saldo: {s.totals.balance} {s.restaurant.currency}
      </h3>
      <p>
        {s.totals.paid
          ? s.account.paymentStatus === 'CREDIT'
            ? 'Saldo a favor del cliente'
            : 'Sin saldo pendiente'
          : 'PENDIENTE DE PAGO'}
      </p>
      {s.tips.length > 0 && (
        <>
          <h3>Propinas — separadas del consumo</h3>
          {s.tips.map((t) => (
            <p key={t.id}>
              {t.kind === 'DIRECT'
                ? 'Directa'
                : t.kind === 'DIGITAL_RECEIPT'
                  ? 'Digital recibida'
                  : 'Digital entregada al trabajador'}
              : {t.amount} · {person(t.beneficiaryUserId)}
            </p>
          ))}
        </>
      )}
      <p>{s.disclaimer}</p>
      <small>Identidad histórica: {doc.sha256}</small>
    </article>
  );
}
