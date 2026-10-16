import TableRestaurantOutlined from '@mui/icons-material/TableRestaurantOutlined';
import { OffsitePanel, modalityLabel } from './OffsitePanel';
import { restauranteApi } from '@/api';
import { FulfillmentPanel } from './FulfillmentPanel';
import { useRestaurantStore } from '../Common/store/restaurantStore';
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { Account, DailyMenu, Operator, Portion, Product, Table } from './types';
import { Run } from './Operations.page';
export function TableChoices({
  tables,
  accounts,
  selected,
  setSelected,
  accountId
}: {
  tables: Table[];
  accounts: Account[];
  selected: string[];
  setSelected: (ids: string[]) => void;
  accountId?: string;
}) {
  return (
    <Box
      className='table-choice-grid'
      role='group'
      aria-label='Seleccionar mesas'
    >
      {tables
        .filter((t) => t.isActive)
        .map((t) => {
          const occupied = accounts.find(
            (a) =>
              a.attentionStatus === 'OPEN' &&
              a.tables.some((x) => x.id === t.id)
          );
          return (
            <FormControlLabel
              key={t.id}
              label={
                <Stack spacing={0.25}>
                  <Stack direction='row' spacing={0.75} alignItems='center'>
                    <TableRestaurantOutlined fontSize='small' />
                    <Typography fontWeight={700}>{t.name}</Typography>
                  </Stack>
                  <Typography variant='caption'>
                    {!t.isAvailable
                      ? 'No disponible'
                      : occupied
                        ? 'Ocupada'
                        : 'Libre'}
                    {selected.includes(t.id) ? ' · Seleccionada' : ''}
                  </Typography>
                </Stack>
              }
              sx={{
                m: 0.5,
                p: 1,
                minWidth: 0,
                width: '100%',
                boxSizing: 'border-box',
                transition: 'border-color .15s',
                outline: selected.includes(t.id) ? '2px solid' : 'none',
                outlineColor: 'primary.main',
                border: '1px solid',
                borderColor: occupied ? 'primary.main' : 'divider',
                borderRadius: 2,
                bgcolor: occupied ? 'action.selected' : 'background.paper'
              }}
              control={
                <Checkbox
                  inputProps={{
                    'aria-label': `${t.name} · ${occupied ? 'Ocupada' : 'Libre'}`
                  }}
                  checked={selected.includes(t.id)}
                  disabled={
                    !t.isAvailable || (!!occupied && occupied.id !== accountId)
                  }
                  onChange={(e) =>
                    setSelected(
                      e.target.checked
                        ? [...selected, t.id]
                        : selected.filter((id) => id !== t.id)
                    )
                  }
                />
              }
            />
          );
        })}
    </Box>
  );
}
export function OperatorSelect({
  operators,
  value,
  onChange
}: {
  operators: Operator[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <TextField
      select
      fullWidth
      label='Mozo responsable'
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {operators.map((o) => (
        <MenuItem key={o.id} value={o.id}>
          {o.firstName} {o.lastName}
        </MenuItem>
      ))}
    </TextField>
  );
}
export function AttentionWorkspace({
  accounts,
  tables,
  operators,
  products,
  menus,
  portions,
  clients,
  run
}: {
  accounts: Account[];
  tables: Table[];
  operators: Operator[];
  products: Product[];
  menus: DailyMenu[];
  portions: Portion[];
  clients: { id: string; person: { firstName: string; lastName: string } }[];
  run: Run;
}) {
  const zone =
    useRestaurantStore((s) => s.restaurant?.timeZone) || 'America/Lima';
  const paymentLabels: Record<string, string> = {
    SETTLED: 'Sin saldo pendiente',
    UNPAID: 'Pendiente',
    PARTIAL: 'Saldo parcial',
    CREDIT: 'Saldo a favor'
  };
  const historyLabels: Record<string, string> = {
    'attention.open': 'Apertura',
    'attention.add': 'Consumo agregado',
    'attention.tables': 'Cambio de mesas',
    'attention.transfer': 'Transferencia de responsable',
    'attention.merge': 'Unión de cuentas',
    'attention.merged-into': 'Cuenta unida a otra',
    'attention.close': 'Cierre de atención',
    'attention.cancel-draft': 'Cancelación de borrador'
  };
  const [modality, setModality] = useState<Account['modality']>('TABLE');
  const [selected, setSelected] = useState('');
  const account = accounts.find((a) => a.id === selected);
  const [tableIds, setTableIds] = useState<string[]>([]);
  const [responsible, setResponsible] = useState('');
  const [client, setClient] = useState('');
  const [reason, setReason] = useState('');
  const [sourceAccount, setSourceAccount] = useState('');
  const [replaceLine, setReplaceLine] = useState('');
  const [sourceType, setSourceType] = useState<'PRODUCT' | 'DAILY_MENU'>(
    'PRODUCT'
  );
  const [sourceId, setSourceId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [accountNotes, setAccountNotes] = useState('');
  const [option, setOption] = useState('');
  const [modifiers, setModifiers] = useState<string[]>([]);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [portion, setPortion] = useState('');
  const [specialPrice, setSpecialPrice] = useState('');
  const [priceReason, setPriceReason] = useState('');
  const product = products.find((p) => p.id === sourceId);
  const menu = menus.find((m) => m.id === sourceId);
  function selectAccount(id: string) {
    setSelected(id);
    setReplaceLine('');
    const next = accounts.find((a) => a.id === id);
    setTableIds(next?.tables.map((t) => t.id) || []);
    setResponsible(next?.responsibleUserId || '');
    setReason('');
  }
  function selectSource(id: string) {
    setSourceId(id);
    setOption('');
    setModifiers([]);
    setSelections({});
    setPortion('');
    setSpecialPrice('');
  }
  const [offsite, setOffsite] = useState({
    customerName: '',
    phone: '',
    address: '',
    reference: ''
  });
  const restaurantId = useRestaurantStore((s) => s.restaurant?.id);
  const [kind, setKind] = useState(''),
    [beneficiary, setBeneficiary] = useState(''),
    [workers, setWorkers] = useState<Operator[]>([]);
  useEffect(() => {
    let active = true;
    restauranteApi
      .get<Operator[]>('/offsite/workers')
      .then((r) => {
        if (active) setWorkers(r.data);
      })
      .catch(() => setWorkers([]));
    return () => {
      active = false;
    };
  }, [restaurantId]);
  async function add() {
    if (!account) return;
    const body = {
      expectedVersion: account.version,
      ...(kind ? { kind } : {}),
      ...(kind === 'STAFF' ? { beneficiaryUserId: beneficiary } : {}),
      ...(replaceLine ? { reason } : {}),
      sourceType,
      sourceId,
      quantity,
      notes,
      ...(sourceType === 'PRODUCT'
        ? {
            ...(option ? { productOptionId: Number(option) } : {}),
            modifierIds: modifiers,
            ...(portion
              ? {
                  portionPolicyId: portion,
                  appliedPrice: Number(specialPrice),
                  priceReason
                }
              : {})
          }
        : {
            selections: Object.entries(selections).map(
              ([componentId, optionId]) => ({ componentId, optionId })
            )
          })
    };
    if (
      await run(
        `/attention-accounts/${account.id}/lines${replaceLine ? `/${replaceLine}/replace` : ''}`,
        body
      )
    ) {
      setNotes('');
      setQuantity(1);
      setReplaceLine('');
    }
  }
  return (
    <Stack spacing={1.5} className='attention-service'>
      <Typography variant='h5' component='h2'>
        Cuentas y mesas
      </Typography>
      <Typography color='text.secondary'>
        Selecciona una cuenta para tomar pedidos o abre una nueva atención.
      </Typography>
      <TextField
        select
        sx={{ maxWidth: 560 }}
        size='small'
        label='Cuenta de atención'
        fullWidth
        value={selected}
        onChange={(e) => selectAccount(e.target.value)}
      >
        <MenuItem value=''>Abrir nueva cuenta</MenuItem>
        {accounts.map((a) => (
          <MenuItem key={a.id} value={a.id}>
            {a.tables.map((t) => t.name).join(' + ') ||
              modalityLabel[a.modality] + ' ' + a.id.slice(0, 8)}{' '}
            · {a.attentionStatus === 'OPEN' ? 'Abierta' : 'Cerrada'} · S/
            {a.total}
          </MenuItem>
        ))}
      </TextField>
      {!account ? (
        <Card
          className={modality === 'TABLE' ? 'open-attention-card' : undefined}
        >
          <CardContent>
            <Box
              className={modality === 'TABLE' ? 'open-attention-layout' : ''}
            >
              {modality === 'TABLE' && (
                <Box className='open-attention-map'>
                  <Stack
                    direction='row'
                    justifyContent='space-between'
                    alignItems='center'
                    mb={1}
                  >
                    <Typography variant='h6' component='h3'>
                      Seleccionar mesas
                    </Typography>
                    <Chip
                      size={modality === 'TABLE' ? 'small' : 'medium'}
                      variant='outlined'
                      label={`${tableIds.length} seleccionadas`}
                    />
                  </Stack>
                  <Typography variant='body2' color='text.secondary' mb={1.5}>
                    Libre: puedes seleccionarla. Ocupada: tiene una cuenta
                    activa.
                  </Typography>
                  {!tables.some((t) => t.isActive) && (
                    <Typography className='operation-empty'>
                      No hay mesas activas. Configúralas desde Gestión de mesas.
                    </Typography>
                  )}
                  <TableChoices
                    tables={tables}
                    accounts={accounts}
                    selected={tableIds}
                    setSelected={setTableIds}
                  />
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    display='block'
                    mt={1.5}
                  >
                    Las reservas no bloquean mesas; se asignan cuando llega el
                    cliente.
                  </Typography>
                </Box>
              )}
              <Stack
                spacing={modality === 'TABLE' ? 1.5 : 2}
                className={
                  modality === 'TABLE'
                    ? 'open-attention-form'
                    : 'operation-form-grid'
                }
              >
                <Typography variant='h6' component='h2'>
                  Abrir atención
                </Typography>
                <TextField
                  size={modality === 'TABLE' ? 'small' : 'medium'}
                  select
                  label='Modalidad'
                  value={modality}
                  onChange={(e) => {
                    setModality(e.target.value as typeof modality);
                    setTableIds([]);
                  }}
                >
                  <MenuItem value='TABLE'>En mesa</MenuItem>
                  <MenuItem value='TAKE_AWAY'>Para llevar</MenuItem>
                  <MenuItem value='OWN_DELIVERY'>Delivery propio</MenuItem>
                  <MenuItem value='EXTERNAL_COURIER'>Courier externo</MenuItem>
                </TextField>
                <OperatorSelect
                  operators={operators}
                  value={responsible}
                  onChange={setResponsible}
                />
                {!operators.length && (
                  <Typography>
                    Administración debe crear o activar un trabajador con rol
                    Mozo antes de abrir atención.
                  </Typography>
                )}
                <TextField
                  size={modality === 'TABLE' ? 'small' : 'medium'}
                  select
                  label='Cliente (opcional)'
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                >
                  <MenuItem value=''>Sin cliente</MenuItem>
                  {clients.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.person.firstName} {c.person.lastName}
                    </MenuItem>
                  ))}
                </TextField>
                {modality !== 'TABLE' &&
                  (
                    ['customerName', 'phone', 'address', 'reference'] as const
                  ).map((key) => (
                    <TextField
                      size='medium'
                      key={key}
                      label={
                        {
                          customerName: 'Nombre de quien recibe',
                          phone: 'Teléfono de contacto',
                          address: 'Dirección de entrega',
                          reference: 'Referencia de entrega'
                        }[key]
                      }
                      value={offsite[key]}
                      onChange={(e) =>
                        setOffsite((f) => ({ ...f, [key]: e.target.value }))
                      }
                    />
                  ))}
                <TextField
                  size={modality === 'TABLE' ? 'small' : 'medium'}
                  label='Observaciones de la atención'
                  value={accountNotes}
                  onChange={(e) => setAccountNotes(e.target.value)}
                />

                <Button
                  variant='contained'
                  disabled={
                    !responsible || (modality === 'TABLE' && !tableIds.length)
                  }
                  onClick={async () => {
                    if (
                      await run('/attention-accounts', {
                        modality,
                        notes: accountNotes,
                        ...(modality !== 'TABLE' ? { offsite } : {}),
                        responsibleUserId: responsible,
                        tableIds,
                        ...(client ? { clientId: client } : {})
                      })
                    ) {
                      setTableIds([]);
                      setClient('');
                    }
                  }}
                >
                  Abrir cuenta
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant='h5'>
                  {account.modality === 'TABLE'
                    ? 'Mesas: ' +
                      (account.tables.map((t) => t.name).join(' + ') ||
                        'Liberadas')
                    : modalityLabel[account.modality]}
                </Typography>
                <Typography>
                  Responsable:{' '}
                  {operators.find((o) => o.id === account.responsibleUserId)
                    ?.firstName || account.responsibleUserId}
                </Typography>
                <Typography>
                  Atención:{' '}
                  {account.attentionStatus === 'OPEN' ? 'Abierta' : 'Cerrada'} ·
                  Pago:{' '}
                  {paymentLabels[account.paymentStatus] ||
                    account.paymentStatus}{' '}
                  · Consumo S/{account.total} · Saldo S/{account.balance}
                </Typography>
                <Typography>{account.notes}</Typography>
                {!account.lines.length && (
                  <Alert severity='info'>
                    Esta cuenta aún no tiene consumos. Agrega el primer producto
                    en el formulario de pedido.
                  </Alert>
                )}
                {account.lines.map((line) => (
                  <Card variant='outlined' key={line.id}>
                    <CardContent>
                      <Typography>
                        {line.quantity} × {line.productSnapshot.name} · S/
                        {line.appliedUnitPrice} · Subtotal S/{line.subtotal} ·{' '}
                        {line.status === 'CANCELLED' ? 'Cancelado' : 'Activo'}
                      </Typography>
                      <Stack direction='row' gap={1} flexWrap='wrap' mt={1}>
                        <Chip
                          size='small'
                          variant='outlined'
                          label={`Confirmado: ${line.confirmedQuantity}`}
                        />
                        {line.status === 'CANCELLED' && (
                          <Chip size='small' color='error' label='Cancelado' />
                        )}
                      </Stack>
                      <Typography color='text.secondary' mt={1}>
                        {line.notes}
                      </Typography>
                      {line.kind === 'STAFF' && (
                        <Typography>
                          Consumo de personal ·{' '}
                          {workers.find((w) => w.id === line.beneficiaryUserId)
                            ?.firstName || line.beneficiaryUserId}{' '}
                          · valor original S/{line.originalUnitPrice}
                        </Typography>
                      )}
                      {line.kind === 'COURTESY' && (
                        <Typography>Cortesía de cliente</Typography>
                      )}
                      {account.attentionStatus === 'OPEN' &&
                        line.status === 'ACTIVE' && (
                          <Button
                            color='error'
                            disabled={reason.trim().length < 2}
                            onClick={() =>
                              void run(
                                `/attention-accounts/${account.id}/lines/${line.id}/cancel`,
                                { expectedVersion: account.version, reason }
                              )
                            }
                          >
                            Cancelar consumo con motivo indicado
                          </Button>
                        )}
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </CardContent>
          </Card>
          {account.modality !== 'TABLE' && (
            <OffsitePanel
              key={'offsite-' + account.id}
              account={account}
              run={run}
            />
          )}
          <FulfillmentPanel key={account.id} account={account} run={run} />
          {account.attentionStatus === 'OPEN' && (
            <>
              <Card>
                <CardContent>
                  <Stack spacing={2} className='operation-form-grid'>
                    <Typography variant='h6'>
                      Agregar o sustituir consumo
                    </Typography>
                    <TextField
                      select
                      label='Tipo de consumo'
                      value={kind}
                      onChange={(e) => setKind(e.target.value)}
                    >
                      <MenuItem value=''>
                        Venta / configuración de carta
                      </MenuItem>
                      <MenuItem value='STAFF'>
                        Consumo gratuito de personal
                      </MenuItem>
                      <MenuItem value='COURTESY'>Cortesía permitida</MenuItem>
                    </TextField>
                    {kind === 'STAFF' && (
                      <TextField
                        select
                        label='Trabajador beneficiario'
                        value={beneficiary}
                        onChange={(e) => setBeneficiary(e.target.value)}
                      >
                        {workers.map((w) => (
                          <MenuItem key={w.id} value={w.id}>
                            {w.firstName} {w.lastName}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                    <TextField
                      select
                      label='Operación del consumo'
                      value={replaceLine}
                      onChange={(e) => setReplaceLine(e.target.value)}
                    >
                      <MenuItem value=''>Agregar nuevo consumo</MenuItem>
                      {account.lines
                        .filter((l) => l.status === 'ACTIVE')
                        .map((l) => (
                          <MenuItem key={l.id} value={l.id}>
                            Sustituir {l.productSnapshot.name} ({l.quantity})
                          </MenuItem>
                        ))}
                    </TextField>
                    {replaceLine && (
                      <Typography>
                        La sustitución cancela toda la línea anterior y solicita
                        las nuevas unidades indicadas, incluso si hubo salidas
                        previas. Requiere el motivo indicado abajo; no recupera
                        porciones automáticamente. Para cambiar solo
                        instrucciones use Observaciones.
                      </Typography>
                    )}
                    <Typography>
                      Cualquier mozo puede agregar consumos en borrador, sin
                      descontar porciones. Sustituir comida ya enviada confirma
                      la sustitución y descuenta sus nuevas porciones.
                    </Typography>
                    <TextField
                      select
                      label='Origen del consumo'
                      value={sourceType}
                      onChange={(e) => {
                        setSourceType(e.target.value as typeof sourceType);
                        selectSource('');
                      }}
                    >
                      <MenuItem value='PRODUCT'>Carta permanente</MenuItem>
                      <MenuItem value='DAILY_MENU'>Menú compuesto</MenuItem>
                    </TextField>
                    <TextField
                      label='Buscar producto o menú'
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder='Escribe un nombre para filtrar las opciones'
                    />
                    <TextField
                      select
                      label='Producto o menú'
                      value={sourceId}
                      onChange={(e) => selectSource(e.target.value)}
                    >
                      {(sourceType === 'PRODUCT'
                        ? products.filter(
                            (p) => p.isActive && p.status === 'AVAILABLE'
                          )
                        : menus.filter((m) => m.isAvailable)
                      )
                        .filter(
                          (p) =>
                            p.id === sourceId ||
                            p.name
                              .toLocaleLowerCase()
                              .includes(
                                productSearch.trim().toLocaleLowerCase()
                              )
                        )
                        .map((p) => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.name} · S/{p.price}
                          </MenuItem>
                        ))}
                    </TextField>
                    {sourceType === 'PRODUCT' && product && (
                      <>
                        {!!product.options.length && (
                          <TextField
                            select
                            label='Presentación'
                            value={option}
                            onChange={(e) => setOption(e.target.value)}
                          >
                            <MenuItem value=''>Estándar</MenuItem>
                            {product.options
                              .filter((o) => o.isActive && o.isAvailable)
                              .map((o) => (
                                <MenuItem key={o.id} value={String(o.id)}>
                                  {o.name} · S/{o.price}
                                </MenuItem>
                              ))}
                          </TextField>
                        )}
                        {product.configuration?.modifiers
                          .filter((m) => m.isAvailable)
                          .map((m) => (
                            <FormControlLabel
                              key={m.id}
                              label={`${m.name} (+S/${m.price})`}
                              control={
                                <Checkbox
                                  checked={modifiers.includes(m.id)}
                                  onChange={(e) =>
                                    setModifiers(
                                      e.target.checked
                                        ? [...modifiers, m.id]
                                        : modifiers.filter((id) => id !== m.id)
                                    )
                                  }
                                />
                              }
                            />
                          ))}
                        <TextField
                          select
                          label='Porción'
                          value={portion}
                          onChange={(e) => setPortion(e.target.value)}
                        >
                          <MenuItem value=''>Estándar</MenuItem>
                          {portions
                            .filter((p) => p.isActive)
                            .map((p) => (
                              <MenuItem key={p.id} value={p.id}>
                                {p.name} · consume {p.availabilityUnits}
                              </MenuItem>
                            ))}
                        </TextField>
                        {portion && (
                          <>
                            <TextField
                              label='Precio de porción sin extras (S/)'
                              type='number'
                              value={specialPrice}
                              inputProps={{ min: 0, step: 0.01 }}
                              onChange={(e) => setSpecialPrice(e.target.value)}
                            />
                            <TextField
                              label='Motivo / indicación de porción especial'
                              value={priceReason}
                              onChange={(e) => setPriceReason(e.target.value)}
                            />
                          </>
                        )}
                      </>
                    )}
                    {sourceType === 'DAILY_MENU' &&
                      menu?.components.map((c) => (
                        <TextField
                          select
                          key={c.id}
                          label={`Elegir ${c.name} (incluido)`}
                          value={selections[c.id] || ''}
                          onChange={(e) =>
                            setSelections({
                              ...selections,
                              [c.id]: e.target.value
                            })
                          }
                        >
                          {c.options
                            .filter(
                              (o) =>
                                o.isAvailable &&
                                (o.portions == null || o.portions > 0)
                            )
                            .map((o) => (
                              <MenuItem key={o.id} value={o.id}>
                                {products.find((p) => p.id === o.productId)
                                  ?.name || 'Producto'}{' '}
                                · incluido
                              </MenuItem>
                            ))}
                        </TextField>
                      ))}
                    <TextField
                      label='Cantidad'
                      type='number'
                      inputProps={{ min: 0.001, step: 0.001 }}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                    />
                    <TextField
                      label='Observaciones por plato'
                      multiline
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <Button
                      variant='contained'
                      disabled={
                        !sourceId || (!!replaceLine && reason.trim().length < 2)
                      }
                      onClick={() => void add()}
                    >
                      {replaceLine
                        ? 'Sustituir consumo con motivo'
                        : 'Agregar consumo'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant='h6'>Mesas y responsable</Typography>
                    <TextField
                      label='Motivo de la operación / cancelación'
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      fullWidth
                    />
                    <TableChoices
                      tables={tables}
                      accounts={accounts}
                      selected={tableIds}
                      setSelected={setTableIds}
                      accountId={account.id}
                    />
                    <Button
                      disabled={!tableIds.length || reason.trim().length < 2}
                      onClick={() =>
                        void run(`/attention-accounts/${account.id}/tables`, {
                          expectedVersion: account.version,
                          tableIds,
                          reason
                        })
                      }
                    >
                      Trasladar / asociar mesas seleccionadas
                    </Button>
                    <OperatorSelect
                      operators={operators}
                      value={responsible}
                      onChange={setResponsible}
                    />
                    <Button
                      disabled={!responsible || reason.trim().length < 2}
                      onClick={() =>
                        void run(`/attention-accounts/${account.id}/transfer`, {
                          expectedVersion: account.version,
                          responsibleUserId: responsible,
                          reason
                        })
                      }
                    >
                      Transferir responsable
                    </Button>
                    <TextField
                      select
                      label='Unir otra cuenta a esta (conserva responsable de esta cuenta)'
                      value={sourceAccount}
                      onChange={(e) => setSourceAccount(e.target.value)}
                    >
                      {accounts
                        .filter(
                          (a) =>
                            a.id !== account.id && a.attentionStatus === 'OPEN'
                        )
                        .map((a) => (
                          <MenuItem key={a.id} value={a.id}>
                            {a.tables.map((t) => t.name).join(' + ')} · S/
                            {a.total}
                          </MenuItem>
                        ))}
                    </TextField>
                    <Button
                      disabled={!sourceAccount || reason.trim().length < 2}
                      onClick={() =>
                        void run(`/attention-accounts/${account.id}/merge`, {
                          expectedVersion: account.version,
                          sourceAccountId: sourceAccount,
                          sourceExpectedVersion: accounts.find(
                            (a) => a.id === sourceAccount
                          )?.version,
                          reason
                        })
                      }
                    >
                      Unir cuentas y mesas
                    </Button>
                    <Button
                      color='warning'
                      disabled={reason.trim().length < 2}
                      onClick={() =>
                        void run(`/attention-accounts/${account.id}/close`, {
                          expectedVersion: account.version,
                          reason,
                          mode: 'END_ATTENTION'
                        })
                      }
                    >
                      Finalizar atención y liberar mesas
                    </Button>
                    <Button
                      disabled={reason.trim().length < 2}
                      onClick={() =>
                        void run(`/attention-accounts/${account.id}/close`, {
                          expectedVersion: account.version,
                          reason,
                          mode: 'WITH_DEBT'
                        })
                      }
                    >
                      Finalizar con deuda previamente registrada
                    </Button>
                    <Typography>
                      Con saldo pendiente se requiere una deuda registrada. Los
                      cobros y el registro de fiados se gestionan en Finanzas.
                      El pago nunca libera una mesa automáticamente.
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </>
          )}
          <Typography variant='h6'>Historial</Typography>
          {account.history.map((h, index) => (
            <Typography key={index}>
              {new Date(h.createdAt).toLocaleString('es-PE', {
                timeZone: zone
              })}{' '}
              · {historyLabels[h.action] || 'Operación registrada'} ·{' '}
              {operators.find((o) => o.id === h.actorId)?.firstName ||
                'Administración'}
            </Typography>
          ))}
        </>
      )}
    </Stack>
  );
}
