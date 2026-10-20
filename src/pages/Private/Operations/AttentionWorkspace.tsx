import { presentationLabel } from './presentationLabel';
import { MoreOptions } from '@/components/operational/MoreOptions';
import { difference, sumMoney } from '../Finance/displayMoney';
import { Link, useSearchParams } from 'react-router-dom';
import { DraftLineEditor } from './DraftLineEditor';
import { useWorkerAccess } from '@/hooks/useWorkerAccess';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/redux';
import { OffsiteCards } from './OffsiteCards';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import { ServiceCatalog } from './ServiceCatalog';
import TableRestaurantOutlined from '@mui/icons-material/TableRestaurantOutlined';
import { OffsitePanel, modalityLabel } from './OffsitePanel';
import { restauranteApi } from '@/api';
import { FulfillmentPanel } from './FulfillmentPanel';
import { useRestaurantStore } from '../Common/store/restaurantStore';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
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
  accountId,
  operators = []
}: {
  tables: Table[];
  accounts: Account[];
  selected: string[];
  setSelected: (ids: string[]) => void;
  accountId?: string;
  operators?: Operator[];
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
              className='point-table-tile'
              data-state={
                selected.includes(t.id)
                  ? 'selected'
                  : !t.isAvailable
                    ? 'unavailable'
                    : occupied
                      ? occupied.hasConfirmedConsumption
                        ? 'occupied'
                        : 'available'
                      : 'available'
              }
              label={
                <Stack spacing={0.25}>
                  <Stack direction='row' spacing={0.75} alignItems='center'>
                    <Typography fontWeight={700}>{t.name}</Typography>
                  </Stack>
                  <Typography variant='caption'>
                    {!t.isAvailable
                      ? 'No disponible'
                      : occupied
                        ? occupied.hasConfirmedConsumption
                          ? 'Ocupada'
                          : 'Atención abierta'
                        : 'Disponible'}
                    {selected.includes(t.id) ? ' · Seleccionada' : ''}
                    {occupied &&
                      operators.find(
                        (o) => o.id === occupied.responsibleUserId
                      ) && (
                        <Typography
                          component='span'
                          variant='caption'
                          display='block'
                        >
                          Mozo:{' '}
                          {
                            operators.find(
                              (o) => o.id === occupied.responsibleUserId
                            )?.firstName
                          }
                        </Typography>
                      )}
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
                  icon={<TableRestaurantOutlined />}
                  checkedIcon={<CheckCircleOutline />}
                  inputProps={{
                    'aria-label': `${t.name} · ${occupied ? (occupied.hasConfirmedConsumption ? 'Ocupada' : 'Atención abierta') : 'Libre'}`
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
      label='Responsable de atención'
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
  const can = useWorkerAccess();
  const user = useSelector(selectAuth).user;
  const waiter = user?.role.name === 'MOZO';
  const [joining, setJoining] = useState(false);
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
    'attention.draft.update': 'Edición de borrador',
    'attention.draft.remove': 'Retiro de borrador',
    'attention.cancel-draft': 'Cancelación de borrador',
    'attention.pending-split': 'Separación auditada de unidades pendientes',
    'attention.return-consumption': 'Devolución excepcional de consumo',
    'attention.draft.configure': 'Personalización de borrador',
    'attention.courtesy': 'Cortesía de cliente'
  };
  const [openAttention, setOpenAttention] = useState(false);
  const [modality, setModality] = useState<Account['modality']>('TABLE');
  const [searchParams] = useSearchParams();
  const [selected, setSelected] = useState(searchParams.get('accountId') || '');
  const appliedLink = useRef<string | null>(null);
  useEffect(() => {
    const linked = searchParams.get('accountId');
    if (!linked) {
      appliedLink.current = null;
    } else if (
      appliedLink.current !== linked &&
      accounts.some((a) => a.id === linked)
    ) {
      selectAccount(linked);
      appliedLink.current = linked;
    }
  }, [searchParams, accounts]);
  const [customizing, setCustomizing] = useState(false);
  const [cancelLine, setCancelLine] = useState('');
  const [courtesyLineId, setCourtesyLineId] = useState('');
  const [courtesyQuantity, setCourtesyQuantity] = useState(1);
  const [courtesyReason, setCourtesyReason] = useState('');
  const [courtesyBusy, setCourtesyBusy] = useState(false);
  const [courtesyError, setCourtesyError] = useState('');
  const [returnConsumption, setReturnConsumption] = useState(false);
  const account = accounts.find((a) => a.id === selected);
  const courtesyLine = account?.lines.find(
    (line) => line.id === courtesyLineId
  );
  const [tableIds, setTableIds] = useState<string[]>([]);
  const [responsible, setResponsible] = useState(user?.id || '');
  const [client, setClient] = useState('');
  const [reason, setReason] = useState('');
  const [sourceAccount, setSourceAccount] = useState('');
  const [replaceLine, setReplaceLine] = useState('');
  const [editDraft, setEditDraft] = useState<{
    id: string;
    version: number;
  } | null>(null);
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
  const [confirmationContainer, setConfirmationContainer] =
    useState<HTMLDivElement | null>(null);
  const [mobilePane, setMobilePane] = useState<'products' | 'order'>(
    'products'
  );
  const [presentationId, setPresentationId] = useState('');
  const [presentationBusy, setPresentationBusy] = useState(false);
  const [captureResets, setCaptureResets] = useState<Record<string, number>>(
    {}
  );
  function resetCapture(id: string) {
    if (id)
      setCaptureResets((current) => ({
        ...current,
        [id]: (current[id] || 0) + 1
      }));
    setNotes('');
    setQuantity(1);
  }
  const presentationProduct = products.find((p) => p.id === presentationId);
  const product = products.find((p) => p.id === sourceId);
  const menu = menus.find((m) => m.id === sourceId);
  function selectAccount(id: string) {
    setSelected(id);
    setMobilePane('products');
    setReplaceLine('');
    const next = accounts.find((a) => a.id === id);
    setTableIds(next?.tables.map((t) => t.id) || []);
    setResponsible(next?.responsibleUserId || user?.id || '');
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
      expectedVersion: editDraft?.version ?? account.version,
      ...(kind ? { kind } : {}),
      ...(kind === 'STAFF' ? { beneficiaryUserId: beneficiary } : {}),
      ...(replaceLine ? { reason } : {}),
      sourceType,
      sourceId,
      ...(!replaceLine ? { mergeDraft: true } : {}),
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
        `/attention-accounts/${account.id}/lines${editDraft ? `/${editDraft.id}/draft-configuration` : replaceLine ? `/${replaceLine}/replace` : ''}`,
        body
      )
    ) {
      if (!editDraft && !replaceLine)
        resetCapture(sourceType === 'PRODUCT' ? sourceId : '');
      setNotes('');
      setQuantity(1);
      setReplaceLine('');
      setCustomizing(false);
      setEditDraft(null);
    }
  }
  async function enterTables(ids: string[]) {
    await run(
      '/attention-accounts/enter',
      {
        tableIds: ids,
        ...(!waiter && responsible ? { responsibleUserId: responsible } : {})
      },
      'post',
      (data) => {
        setSelected((data as Account).id);
        setMobilePane('products');
        setJoining(false);
        setTableIds([]);
      }
    );
  }
  async function chooseProduct(
    id: string,
    selectedQuantity = 1,
    selectedNotes = ''
  ) {
    const item = products.find((p) => p.id === id);
    if (!account || !item) return false;
    setSourceType('PRODUCT');
    selectSource(id);
    setQuantity(selectedQuantity);
    setNotes(selectedNotes);
    setReplaceLine('');
    // Any presentation/configuration keeps the explicit customization path.
    const options = item.options.filter((o) => o.isActive);
    if (
      options.length > 1 &&
      !item.configuration?.modifiers.length &&
      !item.configuration?.combo.length &&
      !kind
    ) {
      setPresentationId(id);
      return;
    }
    if (
      options.length > 1 ||
      (options.length === 1 && !options[0].isDefault) ||
      item.configuration?.modifiers.length ||
      item.configuration?.combo.length ||
      kind
    ) {
      setCustomizing(true);
      return;
    }
    const added = await run(`/attention-accounts/${account.id}/lines`, {
      expectedVersion: account.version,
      sourceType: 'PRODUCT',
      sourceId: id,
      quantity: selectedQuantity,
      notes: selectedNotes,
      mergeDraft: true,
      modifierIds: [],
      ...(options[0] ? { productOptionId: options[0].id } : {})
    });
    if (added) resetCapture(id);
    return added;
  }
  const openingForm = (
    <Stack
      spacing={modality === 'TABLE' ? 1.5 : 2}
      className={
        modality === 'TABLE' ? 'open-attention-form' : 'operation-form-grid'
      }
    >
      <Typography variant='h6' component='h2'>
        Abrir atención
      </Typography>
      {modality !== 'TABLE' && (
        <details className='service-details'>
          <summary>Opciones de reparto</summary>
          <TextField
            select
            size='small'
            label='Tipo de reparto'
            value={modality}
            onChange={(e) => setModality(e.target.value as Account['modality'])}
            fullWidth
          >
            <MenuItem value='OWN_DELIVERY'>Reparto propio</MenuItem>
            <MenuItem value='EXTERNAL_COURIER'>Courier externo</MenuItem>
            <MenuItem value='TAKE_AWAY'>
              Recogida sin mesa (atención independiente)
            </MenuItem>
          </TextField>
          <Typography variant='caption'>
            El envío es gratuito. Entrega y pago se registran por separado.
          </Typography>
        </details>
      )}
      {modality === 'TABLE' && (
        <MoreOptions title='Seleccionar o cambiar mesas'>
          <TableChoices
            tables={tables}
            accounts={accounts}
            selected={tableIds}
            setSelected={setTableIds}
          />
        </MoreOptions>
      )}
      {!waiter && (
        <OperatorSelect
          operators={operators}
          value={responsible}
          onChange={setResponsible}
        />
      )}
      {!operators.length && (
        <Typography>
          No se pudo cargar la lista de responsables. Actualice los datos antes
          de abrir atención.
        </Typography>
      )}
      {modality !== 'TABLE' &&
        (['customerName', 'phone', 'address'] as const).map((key) => (
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
      <MoreOptions title='Más detalles: cliente, referencia y observaciones'>
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
        {modality !== 'TABLE' && (
          <TextField
            label='Referencia de entrega'
            value={offsite.reference}
            onChange={(e) =>
              setOffsite((f) => ({ ...f, reference: e.target.value }))
            }
          />
        )}
        <TextField
          size={modality === 'TABLE' ? 'small' : 'medium'}
          label='Observaciones de la atención'
          value={accountNotes}
          onChange={(e) => setAccountNotes(e.target.value)}
        />
      </MoreOptions>

      <Button
        variant='contained'
        disabled={!responsible || (modality === 'TABLE' && !tableIds.length)}
        onClick={async () => {
          if (
            await run(
              '/attention-accounts',
              {
                modality,
                notes: accountNotes,
                ...(modality !== 'TABLE' ? { offsite } : {}),
                responsibleUserId: responsible,
                tableIds,
                ...(client ? { clientId: client } : {})
              },
              'post',
              (data) => {
                selectAccount((data as Account).id);
                setOpenAttention(false);
              }
            )
          ) {
            setTableIds([]);
            setClient('');
          }
        }}
      >
        Abrir atención
      </Button>
    </Stack>
  );
  const accountCards = (
    <>
      {' '}
      {!account && (
        <Box className='account-cards'>
          {accounts
            .filter(
              (a) => a.attentionStatus === 'OPEN' && a.modality === 'TABLE'
            )
            .map((a) => (
              <Card variant='outlined' className='account-tile' key={a.id}>
                <Typography fontWeight={700}>
                  {a.tables.map((t) => t.name).join(' + ') ||
                    modalityLabel[a.modality]}
                </Typography>
                <Typography variant='body2'>
                  Mozo:{' '}
                  {(() => {
                    const worker = operators.find(
                      (o) => o.id === a.responsibleUserId
                    );
                    return worker
                      ? `${worker.firstName} ${worker.lastName}`
                      : 'Responsable asignado';
                  })()}
                </Typography>
                <Typography variant='body2'>
                  {a.lines.filter((l) => l.status === 'ACTIVE').length} consumos
                  · S/ {a.total}
                </Typography>
                {a.createdAt && (
                  <Typography variant='caption'>
                    Abierta:{' '}
                    {new Date(a.createdAt).toLocaleString('es-PE', {
                      timeZone: zone
                    })}
                  </Typography>
                )}
                <Button
                  size='small'
                  onClick={() => selectAccount(a.id)}
                  aria-label={`Ver cuenta ${a.tables.map((t) => t.name).join(' + ') || a.id.slice(0, 8)}`}
                >
                  Ver cuenta
                </Button>
              </Card>
            ))}
          {!accounts.some(
            (a) => a.attentionStatus === 'OPEN' && a.modality === 'TABLE'
          ) && (
            <Typography color='text.secondary'>
              No hay cuentas abiertas. Selecciona mesas para iniciar la
              atención.
            </Typography>
          )}
        </Box>
      )}{' '}
    </>
  );
  const accountSelector = (
    <>
      {' '}
      <details className='secondary-account-selector'>
        <summary>Buscar otra cuenta / historial de cuentas</summary>
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
      </details>{' '}
    </>
  );
  return (
    <Stack
      spacing={1.5}
      className={`attention-service ${account ? 'has-account' : ''}`}
      data-mobile-pane={mobilePane}
    >
      <Dialog
        open={!!courtesyLine}
        onClose={() => !courtesyBusy && setCourtesyLineId('')}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>Marcar como cortesía</DialogTitle>
        <DialogContent>
          <Stack spacing={2} pt={1}>
            <Typography fontWeight={700}>
              {courtesyLine?.productSnapshot.name}
            </Typography>
            <Typography variant='body2'>
              El valor comercial queda registrado. Las unidades de cortesía no
              se cobran; conservan su preparación y consumo de stock.
            </Typography>
            <TextField
              label='Unidades de cortesía'
              type='number'
              value={courtesyQuantity}
              inputProps={{
                min: 0.001,
                max: courtesyLine ? Number(courtesyLine.quantity) : undefined,
                step: 0.001
              }}
              onChange={(event) =>
                setCourtesyQuantity(Number(event.target.value))
              }
            />
            <TextField
              label='Motivo de cortesía'
              value={courtesyReason}
              onChange={(event) => setCourtesyReason(event.target.value)}
              required
            />
            {courtesyError && <Alert severity='error'>{courtesyError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={courtesyBusy} onClick={() => setCourtesyLineId('')}>
            Volver
          </Button>
          <Button
            variant='contained'
            disabled={
              courtesyBusy ||
              !Number.isFinite(courtesyQuantity) ||
              courtesyQuantity <= 0 ||
              courtesyQuantity > Number(courtesyLine?.quantity) ||
              courtesyReason.trim().length < 2
            }
            onClick={async () => {
              if (!account || !courtesyLine || courtesyBusy) return;
              setCourtesyBusy(true);
              setCourtesyError('');
              try {
                if (
                  await run(
                    `/attention-accounts/${account.id}/lines/${courtesyLine.id}/courtesy`,
                    {
                      expectedVersion: account.version,
                      quantity: courtesyQuantity,
                      reason: courtesyReason
                    },
                    'post',
                    undefined,
                    setCourtesyError
                  )
                )
                  setCourtesyLineId('');
              } finally {
                setCourtesyBusy(false);
              }
            }}
          >
            {courtesyBusy ? 'Guardando…' : 'Confirmar cortesía'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={!!presentationProduct && !!account}
        onClose={() => !presentationBusy && setPresentationId('')}
        fullWidth
        maxWidth='xs'
      >
        <DialogTitle>{presentationProduct?.name}</DialogTitle>
        <DialogContent>
          <Typography color='text.secondary' sx={{ mb: 2 }}>
            Elige una presentación para agregar al pedido.
          </Typography>
          <Stack spacing={1}>
            {presentationProduct?.options
              .filter((o) => o.isActive)
              .map((o) => (
                <Button
                  key={o.id}
                  variant='outlined'
                  disabled={presentationBusy || !o.isAvailable}
                  onClick={async () => {
                    if (!account || presentationBusy) return;
                    setPresentationBusy(true);
                    try {
                      if (
                        await run(`/attention-accounts/${account.id}/lines`, {
                          expectedVersion: account.version,
                          sourceType: 'PRODUCT',
                          sourceId: presentationProduct.id,
                          productOptionId: o.id,
                          quantity,
                          notes,
                          mergeDraft: true,
                          modifierIds: []
                        })
                      ) {
                        resetCapture(presentationProduct.id);
                        setPresentationId('');
                      }
                    } finally {
                      setPresentationBusy(false);
                    }
                  }}
                >
                  {presentationLabel(o.name)} · S/ {o.price}
                </Button>
              ))}
            <Button
              disabled={presentationBusy}
              onClick={() => {
                setPresentationId('');
                setCustomizing(true);
              }}
            >
              Personalizar cantidad y observaciones
            </Button>
            <Button
              disabled={presentationBusy}
              onClick={() => setPresentationId('')}
            >
              Volver a la carta
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
      <Stack direction='row' justifyContent='space-between' alignItems='center'>
        <Typography variant='h5' component='h2'>
          {account ? 'Tomar pedido' : 'Mesas y cuentas'}
        </Typography>
        {account && (
          <Button variant='outlined' onClick={() => selectAccount('')}>
            Volver a mesas
          </Button>
        )}
      </Stack>
      {account && (
        <Stack className='mobile-order-tabs' direction='row' gap={1}>
          <Button
            aria-pressed={mobilePane === 'products'}
            variant={mobilePane === 'products' ? 'contained' : 'outlined'}
            onClick={() => setMobilePane('products')}
          >
            Productos
          </Button>
          <Button
            aria-pressed={mobilePane === 'order'}
            variant={mobilePane === 'order' ? 'contained' : 'outlined'}
            onClick={() => setMobilePane('order')}
          >
            Pedido actual · S/ {account.total}
          </Button>
        </Stack>
      )}
      {!account && can('delivery') && (
        <Stack
          direction='row'
          gap={1}
          flexWrap='wrap'
          aria-label='Modalidad de atención'
        >
          {Object.entries({ TABLE: 'Mesa', OWN_DELIVERY: 'Delivery' }).map(
            ([value, label]) => (
              <Button
                key={value}
                size='small'
                variant={
                  (
                    value === 'TABLE'
                      ? modality === 'TABLE'
                      : modality !== 'TABLE'
                  )
                    ? 'contained'
                    : 'outlined'
                }
                aria-pressed={
                  value === 'TABLE'
                    ? modality === 'TABLE'
                    : modality !== 'TABLE'
                }
                onClick={() => {
                  setModality(value as Account['modality']);
                  setTableIds([]);
                }}
              >
                {label}
              </Button>
            )
          )}
        </Stack>
      )}
      {!account ? (
        <Card
          className={modality === 'TABLE' ? 'open-attention-card' : undefined}
        >
          <CardContent>
            <Box className={''}>
              {modality === 'TABLE' && (
                <Box className='open-attention-map'>
                  <Stack
                    direction='row'
                    justifyContent='space-between'
                    alignItems='center'
                    mb={1}
                  >
                    <Typography variant='h6' component='h3'>
                      {joining
                        ? 'Seleccionar mesas'
                        : 'Toca una mesa para atender'}
                    </Typography>
                    <Chip
                      size={modality === 'TABLE' ? 'small' : 'medium'}
                      variant='outlined'
                      label={
                        joining
                          ? `${tableIds.length} seleccionadas`
                          : 'Atención rápida'
                      }
                    />
                  </Stack>
                  <Typography variant='body2' color='text.secondary' mb={1.5}>
                    Disponible: inicia la atención. Ocupada: abre su cuenta
                    actual.
                  </Typography>
                  {!tables.some((t) => t.isActive) && (
                    <Typography className='operation-empty'>
                      No hay mesas activas. Configúralas desde Gestión de mesas.
                    </Typography>
                  )}
                  <Stack direction='row' gap={1} mb={1}>
                    <Button
                      variant={joining ? 'contained' : 'outlined'}
                      onClick={() => {
                        setJoining(!joining);
                        setTableIds([]);
                      }}
                    >
                      {joining ? 'Cancelar selección' : 'Unir mesas'}
                    </Button>
                    {joining && (
                      <Button
                        variant='contained'
                        disabled={tableIds.length < 2}
                        onClick={() =>
                          waiter
                            ? void enterTables(tableIds)
                            : setOpenAttention(true)
                        }
                      >
                        Unir y atender
                      </Button>
                    )}
                  </Stack>
                  <Box className='quick-table-grid'>
                    {tables
                      .filter((t) => t.isActive)
                      .map((t) => {
                        const active = accounts.find(
                          (a) =>
                            a.attentionStatus === 'OPEN' &&
                            a.tables.some((x) => x.id === t.id)
                        );
                        const chosen = joining && tableIds.includes(t.id);
                        return (
                          <Button
                            key={t.id}
                            className='quick-table'
                            data-occupied={!!active?.hasConfirmedConsumption}
                            data-open-draft={
                              !!active && !active.hasConfirmedConsumption
                            }
                            variant='outlined'
                            aria-pressed={joining ? chosen : undefined}
                            disabled={
                              (!t.isAvailable && !active) ||
                              (joining && !!active)
                            }
                            onClick={() => {
                              if (joining)
                                setTableIds(
                                  chosen
                                    ? tableIds.filter((id) => id !== t.id)
                                    : [...tableIds, t.id]
                                );
                              else if (active) selectAccount(active.id);
                              else if (!waiter) {
                                setTableIds([t.id]);
                                setOpenAttention(true);
                              } else void enterTables([t.id]);
                            }}
                          >
                            <TableRestaurantOutlined />
                            <strong>{t.name}</strong>
                            {active && !active.hasConfirmedConsumption && (
                              <Chip
                                size='small'
                                label='ABIERTA'
                                className='open-draft-badge'
                              />
                            )}
                            <span>
                              {chosen
                                ? '✓ Seleccionada'
                                : active
                                  ? active.hasConfirmedConsumption
                                    ? 'Ocupada'
                                    : 'Atención abierta'
                                  : !t.isAvailable
                                    ? 'No disponible'
                                    : 'Disponible'}
                            </span>
                            {active && (
                              <small>
                                {(() => {
                                  const person = operators.find(
                                    (o) => o.id === active.responsibleUserId
                                  );
                                  return person
                                    ? `${person.firstName} ${person.lastName}`
                                    : 'Responsable asignado';
                                })()}{' '}
                                · S/ {active.total}
                                {active.tables.length > 1
                                  ? ` · ${active.tables.map((t) => t.name).join(' + ')}`
                                  : ''}
                              </small>
                            )}
                          </Button>
                        );
                      })}
                  </Box>
                  <Typography variant='h6' mt={2} mb={1}>
                    Cuentas abiertas
                  </Typography>
                  {accountCards}

                  {!waiter && (
                    <Button onClick={() => setOpenAttention(true)}>
                      Abrir atención manualmente
                    </Button>
                  )}
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
              {modality !== 'TABLE' ? (
                openingForm
              ) : (
                <Dialog
                  open={openAttention}
                  onClose={() => setOpenAttention(false)}
                  fullWidth
                  maxWidth='sm'
                >
                  <DialogTitle>
                    Abrir atención ·{' '}
                    {tables
                      .filter((t) => tableIds.includes(t.id))
                      .map((t) => t.name)
                      .join(' + ')}
                  </DialogTitle>
                  <DialogContent>
                    {openingForm}
                    <Button onClick={() => setOpenAttention(false)}>
                      Volver
                    </Button>
                  </DialogContent>
                </Dialog>
              )}
            </Box>
          </CardContent>
        </Card>
      ) : (
        <>
          <Box className='order-workbench'>
            <Box className='order-catalog' id='service-catalog'>
              <Button
                sx={{ display: { md: 'none' } }}
                onClick={() => setMobilePane('order')}
              >
                Ver pedido actual
              </Button>
              {account.attentionStatus === 'OPEN' ? (
                <>
                  <Typography variant='h6' mb={1}>
                    Carta permanente
                  </Typography>
                  <ServiceCatalog
                    products={products}
                    key={account.id}
                    captureResets={captureResets}
                    onSelect={chooseProduct}
                  />
                  <Typography variant='h6' mt={2} mb={1}>
                    Menú compuesto · precio conjunto
                  </Typography>
                  <Box className='account-cards'>
                    {menus
                      .filter((m) => m.isAvailable)
                      .map((m) => (
                        <Card className='account-tile' key={m.id}>
                          <Typography fontWeight={700}>{m.name}</Typography>
                          <Typography>S/ {m.price}</Typography>
                          <Typography variant='caption'>
                            {m.components.map((c) => c.name).join(' · ')}{' '}
                            incluidos
                          </Typography>
                          <Button
                            onClick={() => {
                              setSourceType('DAILY_MENU');
                              selectSource(m.id);
                              setReplaceLine('');
                              setCustomizing(true);
                            }}
                          >
                            Elegir menú {m.name}
                          </Button>
                        </Card>
                      ))}
                  </Box>
                  <Button
                    onClick={() => {
                      setReplaceLine('');
                      setCustomizing(true);
                    }}
                  >
                    Agregar productos / personalizar
                  </Button>
                </>
              ) : (
                <Typography className='operation-empty'>
                  Atención cerrada. Consulta los consumos y su historial.
                </Typography>
              )}
            </Box>
            <Box className='current-order' id='current-order'>
              <Button
                sx={{ display: { md: 'none' } }}
                onClick={() => setMobilePane('products')}
              >
                Volver a productos
              </Button>
              <Card className='current-order-card'>
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant='overline'>Pedido actual</Typography>
                    <Typography variant='h5'>
                      {account.modality === 'TABLE'
                        ? 'Mesas: ' +
                          (account.tables.map((t) => t.name).join(' + ') ||
                            'Liberadas')
                        : modalityLabel[account.modality]}
                    </Typography>
                    <Typography>
                      Responsable:{' '}
                      {operators
                        .filter((o) => o.id === account.responsibleUserId)
                        .map((o) => `${o.firstName} ${o.lastName}`)
                        .join('') || 'Responsable asignado'}
                    </Typography>
                    <Typography>
                      Atención:{' '}
                      {account.attentionStatus === 'OPEN'
                        ? 'Abierta'
                        : 'Cerrada'}{' '}
                      · Pago:{' '}
                      {paymentLabels[account.paymentStatus] ||
                        account.paymentStatus}{' '}
                      · Consumo S/{account.total} · Saldo S/{account.balance}
                    </Typography>
                    <Typography>{account.notes}</Typography>
                    {!account.lines.length && (
                      <Alert severity='info'>
                        Esta cuenta aún no tiene consumos. Agrega el primer
                        producto en el formulario de pedido.
                      </Alert>
                    )}
                    {account.lines.map((line) => (
                      <Card variant='outlined' key={line.id}>
                        <CardContent>
                          <Typography>
                            <strong>
                              × {Number(line.quantity)} ·{' '}
                              {line.productSnapshot.name}
                            </strong>{' '}
                            · S/
                            {line.appliedUnitPrice} · Subtotal S/{line.subtotal}{' '}
                            ·{' '}
                            {line.status === 'CANCELLED'
                              ? 'Cancelado'
                              : !Number(line.confirmedQuantity)
                                ? 'Borrador'
                                : line.hasDeliveredUnits &&
                                    Number(line.changeableQuantity) === 0
                                  ? 'Entregado'
                                  : line.hasDeliveredUnits
                                    ? 'Salida parcial'
                                    : 'Confirmado'}
                          </Typography>
                          <Stack direction='row' gap={1} flexWrap='wrap' mt={1}>
                            {Number(line.confirmedQuantity) > 0 && (
                              <Chip
                                size='small'
                                variant='outlined'
                                label={`Confirmado: ${Number(line.confirmedQuantity)}`}
                              />
                            )}
                            {line.status === 'CANCELLED' && (
                              <Chip
                                size='small'
                                color='error'
                                label='Cancelado'
                              />
                            )}
                          </Stack>
                          <Typography color='text.secondary' mt={1}>
                            {line.notes}
                          </Typography>
                          {Number(line.takeawayQuantity) > 0 && (
                            <Chip
                              size='small'
                              color='warning'
                              label={`Para llevar: ${line.takeawayQuantity}`}
                            />
                          )}
                          {line.hasDeliveredUnits && (
                            <Typography variant='caption'>
                              Unidades entregadas protegidas · corrección con
                              motivo en Más opciones de salidas.
                            </Typography>
                          )}
                          {line.hasDeliveredUnits &&
                            line.status === 'ACTIVE' &&
                            account.attentionStatus === 'OPEN' && (
                              <details className='service-details'>
                                <summary>
                                  Más opciones de unidades entregadas
                                </summary>
                                <Typography variant='caption'>
                                  Para una salida marcada por error, use
                                  Corregir entrega en las salidas.
                                </Typography>
                                <Button
                                  color='error'
                                  onClick={() => {
                                    setReturnConsumption(true);
                                    setCancelLine(line.id);
                                    setReason('');
                                  }}
                                >
                                  Registrar devolución de consumo
                                </Button>
                                {can('finance') && (
                                  <Button
                                    component={Link}
                                    to={`/finance?accountId=${account.id}`}
                                  >
                                    Reembolsos de pagos
                                  </Button>
                                )}
                              </details>
                            )}
                          {line.kind === 'STAFF' && (
                            <Typography>
                              Consumo de personal ·{' '}
                              {workers.find(
                                (w) => w.id === line.beneficiaryUserId
                              )?.firstName || line.beneficiaryUserId}{' '}
                              · valor original S/{line.originalUnitPrice}
                            </Typography>
                          )}
                          {line.kind === 'COURTESY' && (
                            <Typography>Cortesía de cliente</Typography>
                          )}
                          {account.attentionStatus === 'OPEN' &&
                            line.status === 'ACTIVE' &&
                            (!line.kind || line.kind === 'SALE') &&
                            can('attention') && (
                              <>
                                <Button
                                  size='small'
                                  variant='outlined'
                                  color='secondary'
                                  onClick={() => {
                                    setCourtesyLineId(line.id);
                                    setCourtesyQuantity(Number(line.quantity));
                                    setCourtesyReason('');
                                    setCourtesyError('');
                                  }}
                                >
                                  Marcar como cortesía
                                </Button>
                                <MoreOptions title='MÃ¡s opciones del producto'>
                                  <Button
                                    onClick={() => {
                                      setCourtesyLineId(line.id);
                                      setCourtesyQuantity(Number(line.quantity));
                                      setCourtesyReason('');
                                      setCourtesyError('');
                                    }}
                                  >
                                    Marcar como cortesía
                                  </Button>
                                </MoreOptions>
                              </>
                            )}
                          {account.attentionStatus === 'OPEN' &&
                            line.status === 'ACTIVE' &&
                            !Number(line.confirmedQuantity) && (
                              <>
                                <DraftLineEditor
                                  account={account}
                                  line={line}
                                  run={run}
                                />
                                <Button
                                  size='small'
                                  onClick={() => {
                                    setEditDraft({
                                      id: line.id,
                                      version: account.version
                                    });
                                    setReplaceLine('');
                                    setSourceType(line.sourceType);
                                    selectSource(line.sourceId);
                                    setQuantity(Number(line.quantity));
                                    setNotes(line.notes);
                                    setKind(
                                      line.kind === 'SALE'
                                        ? ''
                                        : line.kind || ''
                                    );
                                    setBeneficiary(
                                      line.beneficiaryUserId || ''
                                    );
                                    setOption(
                                      line.productSnapshot.option
                                        ? String(line.productSnapshot.option.id)
                                        : ''
                                    );
                                    setModifiers(
                                      (
                                        line.productSnapshot.modifiers || []
                                      ).map((m) => m.id)
                                    );
                                    setSelections(
                                      Object.fromEntries(
                                        (
                                          line.productSnapshot.components || []
                                        ).map((c) => [
                                          c.componentId,
                                          c.optionId
                                        ])
                                      )
                                    );
                                    setPortion(
                                      line.productSnapshot.portionPolicyId || ''
                                    );
                                    setSpecialPrice(
                                      difference(
                                        line.appliedUnitPrice,
                                        sumMoney(
                                          (
                                            line.productSnapshot.modifiers || []
                                          ).map((m) =>
                                            Number(m.price).toFixed(2)
                                          )
                                        )
                                      )
                                    );
                                    setPriceReason(
                                      line.productSnapshot.priceReason || ''
                                    );
                                    setCustomizing(true);
                                  }}
                                >
                                  Personalizar borrador
                                </Button>
                              </>
                            )}
                          {account.attentionStatus === 'OPEN' &&
                            line.status === 'ACTIVE' &&
                            Number(line.confirmedQuantity) > 0 &&
                            Number(line.changeableQuantity ?? line.quantity) >
                              0 && (
                              <Stack direction='row' gap={1}>
                                <Button
                                  size='small'
                                  onClick={() => {
                                    setReplaceLine(line.id);
                                    setQuantity(
                                      Number(
                                        line.changeableQuantity ?? line.quantity
                                      )
                                    );
                                    selectSource('');
                                    setReason('');
                                    setCustomizing(true);
                                  }}
                                >
                                  Sustituir
                                </Button>
                                <Button
                                  size='small'
                                  color='error'
                                  onClick={() => {
                                    setReturnConsumption(false);
                                    setCancelLine(line.id);
                                    setReason('');
                                  }}
                                >
                                  Cancelar pendientes (
                                  {Number(
                                    line.changeableQuantity ?? line.quantity
                                  )}
                                  )
                                </Button>
                              </Stack>
                            )}
                        </CardContent>
                      </Card>
                    ))}
                    <Box className='order-total'>
                      {account.grossTotal != null && (
                        <Typography>
                          Subtotal S/ {account.grossTotal}
                        </Typography>
                      )}
                      {account.discountTotal != null && (
                        <Typography>
                          Descuento S/ {account.discountTotal}
                        </Typography>
                      )}
                      <Typography variant='h5'>
                        Total S/ {account.total}
                      </Typography>
                      <Typography>Saldo S/ {account.balance}</Typography>
                      <div
                        className='order-production'
                        ref={setConfirmationContainer}
                      />
                      {can('finance') && Number(account.balance) > 0 && (
                        <Button
                          variant='contained'
                          component={Link}
                          to={`/finance?accountId=${account.id}&pay=1`}
                        >
                          Cobrar S/ {account.balance}
                        </Button>
                      )}
                      {account.attentionStatus === 'OPEN' &&
                        Number(account.balance) === 0 && (
                          <MoreOptions title='Más opciones de atención'>
                            <Button
                              variant='contained'
                              onClick={() =>
                                void run(
                                  `/attention-accounts/${account.id}/close`,
                                  {
                                    expectedVersion: account.version,
                                    mode: 'END_ATTENTION',
                                    reason:
                                      'El cliente se retiró; atención finalizada'
                                  },
                                  'post',
                                  () => selectAccount('')
                                )
                              }
                            >
                              Finalizar atención
                            </Button>
                          </MoreOptions>
                        )}
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
              <FulfillmentPanel
                key={account.id}
                account={account}
                run={run}
                confirmationContainer={confirmationContainer}
              />
            </Box>
          </Box>
          {account.modality !== 'TABLE' && (
            <OffsitePanel
              key={'offsite-' + account.id}
              account={account}
              run={run}
            />
          )}

          {account.attentionStatus === 'OPEN' && (
            <>
              <Dialog
                open={customizing}
                onClose={() => {
                  setCustomizing(false);
                  setEditDraft(null);
                }}
                fullWidth
                maxWidth='sm'
              >
                <DialogTitle>Personalizar consumo</DialogTitle>
                <DialogContent>
                  <Button onClick={() => setCustomizing(false)}>
                    Volver al catálogo
                  </Button>
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
                          <MenuItem value='COURTESY'>
                            Cortesía permitida
                          </MenuItem>
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
                          label={
                            editDraft
                              ? 'Personalización del borrador'
                              : 'Operación del consumo'
                          }
                          disabled={!!editDraft}
                          value={replaceLine}
                          onChange={(e) => setReplaceLine(e.target.value)}
                        >
                          <MenuItem value=''>
                            {editDraft
                              ? 'Guardar sobre el mismo borrador'
                              : 'Agregar nuevo consumo'}
                          </MenuItem>
                          {account.lines
                            .filter(
                              (l) =>
                                l.status === 'ACTIVE' &&
                                Number(l.confirmedQuantity) > 0 &&
                                Number(l.changeableQuantity ?? l.quantity) > 0
                            )
                            .map((l) => (
                              <MenuItem key={l.id} value={l.id}>
                                Sustituir {l.productSnapshot.name} ({l.quantity}
                                )
                              </MenuItem>
                            ))}
                        </TextField>
                        {replaceLine && (
                          <Typography>
                            La sustitución afecta únicamente las unidades
                            pendientes. Las entregadas y su historial se
                            conservan. Requiere motivo; no recupera porciones
                            automáticamente. Para cambiar solo instrucciones use
                            Observaciones.
                          </Typography>
                        )}
                        <Typography>
                          Cualquier mozo puede agregar consumos en borrador, sin
                          descontar porciones. Sustituir comida ya enviada
                          confirma la sustitución y descuenta sus nuevas
                          porciones.
                        </Typography>
                        {replaceLine && (
                          <TextField
                            label='Motivo de sustitución'
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                          />
                        )}
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
                                      {presentationLabel(o.name)} · S/{o.price}
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
                                            : modifiers.filter(
                                                (id) => id !== m.id
                                              )
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
                                  onChange={(e) =>
                                    setSpecialPrice(e.target.value)
                                  }
                                />
                                <TextField
                                  label='Motivo / indicación de porción especial'
                                  value={priceReason}
                                  onChange={(e) =>
                                    setPriceReason(e.target.value)
                                  }
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
                        <Stack direction='row' alignItems='center' gap={1}>
                          <Button
                            variant='outlined'
                            aria-label='Reducir cantidad'
                            disabled={quantity <= 1}
                            onClick={() =>
                              setQuantity((q) => Math.max(1, q - 1))
                            }
                          >
                            −
                          </Button>
                          <TextField
                            label='Cantidad'
                            type='number'
                            inputProps={{ min: 0.001, step: 0.001 }}
                            value={quantity}
                            onChange={(e) =>
                              setQuantity(Number(e.target.value))
                            }
                          />
                          <Button
                            variant='outlined'
                            aria-label='Aumentar cantidad'
                            onClick={() => setQuantity((q) => q + 1)}
                          >
                            +
                          </Button>
                        </Stack>
                        <TextField
                          label='Observaciones por plato'
                          multiline
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                        <Button
                          variant='contained'
                          disabled={
                            !sourceId ||
                            (!!replaceLine && reason.trim().length < 2)
                          }
                          onClick={() => void add()}
                        >
                          {editDraft
                            ? 'Guardar personalización del borrador'
                            : replaceLine
                              ? 'Sustituir consumo con motivo'
                              : 'Agregar consumo'}
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </DialogContent>
              </Dialog>
              <details className='service-details'>
                <summary>
                  Mesas y responsable · unir, trasladar o transferir
                </summary>
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
                        Trasladar atención a las mesas seleccionadas
                      </Button>
                      <Button
                        disabled={!tableIds.length || reason.trim().length < 2}
                        onClick={() =>
                          void run(`/attention-accounts/${account.id}/tables`, {
                            expectedVersion: account.version,
                            tableIds: Array.from(
                              new Set([
                                ...account.tables.map((t) => t.id),
                                ...tableIds
                              ])
                            ),
                            reason
                          })
                        }
                      >
                        Unir/agregar mesas seleccionadas
                      </Button>
                      <OperatorSelect
                        operators={operators}
                        value={responsible}
                        onChange={setResponsible}
                      />
                      <Button
                        disabled={!responsible || reason.trim().length < 2}
                        onClick={() =>
                          void run(
                            `/attention-accounts/${account.id}/transfer`,
                            {
                              expectedVersion: account.version,
                              responsibleUserId: responsible,
                              reason
                            }
                          )
                        }
                      >
                        Cambiar responsable
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
                              a.id !== account.id &&
                              a.attentionStatus === 'OPEN'
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
                        Con saldo pendiente se requiere una deuda registrada.
                        Los cobros y el registro de fiados se gestionan en
                        Finanzas. El pago nunca libera una mesa automáticamente.
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </details>
            </>
          )}
          <details className='service-details'>
            <summary>Historial de la cuenta</summary>
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
          </details>
          <Dialog
            open={!!cancelLine}
            onClose={() => setCancelLine('')}
            fullWidth
            maxWidth='xs'
          >
            <DialogTitle>
              {returnConsumption
                ? 'Devolución excepcional de consumo'
                : 'Cancelar unidades pendientes'}
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2} pt={1}>
                {returnConsumption && (
                  <Alert severity='warning'>
                    Anula el consumo completo de esta línea y conserva las
                    salidas originales. No devuelve dinero automáticamente:
                    registre el reembolso por separado en Cobros si corresponde.
                    No recupera porciones.
                  </Alert>
                )}
                <TextField
                  label={
                    returnConsumption
                      ? 'Motivo de devolución'
                      : 'Motivo de cancelación'
                  }
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <Button
                  color='error'
                  variant='contained'
                  disabled={reason.trim().length < 2}
                  onClick={async () => {
                    if (
                      await run(
                        `/attention-accounts/${account.id}/lines/${cancelLine}/${returnConsumption ? 'return' : 'cancel'}`,
                        { expectedVersion: account.version, reason }
                      )
                    )
                      setCancelLine('');
                  }}
                >
                  {returnConsumption
                    ? 'Confirmar devolución de consumo'
                    : 'Confirmar cancelación'}
                </Button>
                <Button onClick={() => setCancelLine('')}>Volver</Button>
              </Stack>
            </DialogContent>
          </Dialog>
        </>
      )}
      {!account && modality !== 'TABLE' && can('delivery') && (
        <OffsiteCards
          accounts={accounts}
          operators={operators}
          onSelect={selectAccount}
        />
      )}
      {accountSelector}
    </Stack>
  );
}
