import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { restauranteApi } from '@/api';
import { DateRange } from './reportView';
import {
  CommandDetail,
  CommandResult,
  CommandRow,
  commandTotals,
  commandStatus,
  commandType,
  paymentStatus
} from './commandReport';
type Option = { id: string; name: string };
const requestParams = (
  range: DateRange,
  filters: { modality: string; userId: string; status: string; tableId: string },
  page: number
) => ({
  ...range,
  ...Object.fromEntries(
    Object.entries(filters).filter(([, value]) => Boolean(value))
  ),
  page,
  limit: 100
});
export function CommandReportPanel({
  range,
  timeZone
}: {
  range: DateRange;
  timeZone: string;
}) {
  const [filters, setFilters] = useState({
      modality: '',
      userId: '',
      status: '',
      tableId: ''
    }),
    [reportRange, setReportRange] = useState(range),
    [data, setData] = useState<CommandResult>(),
    [fullRows, setFullRows] = useState<CommandRow[]>([]),
    [workers, setWorkers] = useState<Option[]>([]),
    [tables, setTables] = useState<Option[]>([]),
    [selected, setSelected] = useState<CommandDetail>(),
    [full, setFull] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    setReportRange(range);
  }, [range.from, range.to]);
  useEffect(() => {
    Promise.all([
      restauranteApi.get<Option[]>('/operational-reports/directory'),
      restauranteApi.get<{ tables: Option[] }>('/operational-reports/options')
    ])
      .then(([w, t]) => {
        setWorkers(w.data);
        setTables(t.data.tables);
      })
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError('');
    restauranteApi
      .get<CommandResult>('/operational-reports/commands', {
        params: requestParams(reportRange, filters, 1)
      })
      .then((r) => active && setData(r.data))
      .catch(
        () => active && setError('No se pudo cargar el reporte de comandas.')
      )
      .finally(() => active && setBusy(false));
    return () => {
      active = false;
    };
  }, [
    reportRange.from,
    reportRange.to,
    filters.modality,
    filters.userId,
    filters.status,
    filters.tableId
  ]);
  const preview = data?.rows.slice(0, 10) || [],
    totals = useMemo(() => commandTotals(data?.rows || []), [data]);
  const open = async (row: CommandRow) =>
    setSelected(
      (
        await restauranteApi.get<CommandDetail>(
          `/operational-reports/commands/${row.accountId}`
        )
      ).data
    );
  const loadAll = async () => {
    if (!data) return [];
    const rows = [...data.rows];
    for (let page = 2; page <= Math.ceil(data.total / 100); page += 1) {
      const response = await restauranteApi.get<CommandResult>(
        '/operational-reports/commands',
        { params: requestParams(reportRange, filters, page) }
      );
      rows.push(...response.data.rows);
    }
    return rows;
  };
  const showFull = async () => {
    setBusy(true);
    try {
      setFullRows(await loadAll());
      setFull(true);
    } catch {
      setError('No se pudo cargar el reporte completo.');
    } finally {
      setBusy(false);
    }
  };
  const download = async () => {
    if (!data) return;
    setBusy(true);
    try {
      const rows = await loadAll();
      const details = await Promise.all(
        rows.map(
          async (r) =>
            (
              await restauranteApi.get<CommandDetail>(
                `/operational-reports/commands/${r.accountId}`
              )
            ).data
        )
      );
      const { downloadCommandReport } = await import('./commandReportPdf');
      downloadCommandReport(rows, details, reportRange, timeZone);
    } catch {
      setError('No se pudo generar el PDF.');
    } finally {
      setBusy(false);
    }
  };
  const grid = (rows: CommandRow[]) => (
    <div className='command-table-wrap'>
      <Table size='small'>
        <TableHead>
          <TableRow>
            {[
              'Comanda',
              'Tipo',
              'Mesa / Cliente',
              'Mozo',
              'Hora',
              'N.º Ped.',
              'Total',
              'Estado',
              'Pago',
              ''
            ].map((x) => (
              <TableCell key={x}>{x}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow hover key={r.accountId}>
              <TableCell>
                CM-{r.commandNumber || r.accountId.slice(0, 6)}
              </TableCell>
              <TableCell>{commandType(r.modality)}</TableCell>
              <TableCell>{r.tables}</TableCell>
              <TableCell>{r.waiter}</TableCell>
              <TableCell>
                {new Date(r.createdAt).toLocaleTimeString('es-PE', {
                  timeZone,
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </TableCell>
              <TableCell>{r.orders}</TableCell>
              <TableCell>S/ {r.total}</TableCell>
              <TableCell>
                <Chip size='small' label={commandStatus(r.attentionStatus)} />
              </TableCell>
              <TableCell>
                <Chip
                  size='small'
                  color={
                    r.paymentStatus === 'SETTLED'
                      ? 'success'
                      : r.paymentStatus === 'PARTIAL'
                        ? 'warning'
                        : 'default'
                  }
                  label={paymentStatus(r.paymentStatus)}
                />
              </TableCell>
              <TableCell>
                <IconButton
                  size='small'
                  onClick={() => void open(r)}
                  aria-label='Abrir comanda'
                >
                  <VisibilityOutlinedIcon fontSize='small' />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
  return (
    <>
      <Card className='command-report-card'>
        <div className='command-report-title'>
          <ReceiptLongRoundedIcon />
          <div>
            <Typography variant='h6' fontWeight={800}>
              Reporte de Mesas y Comandas
            </Typography>
            <Typography variant='caption'>
              Detalle real de mesas, pedidos y delivery.
            </Typography>
          </div>
        </div>
        <div className='command-filters'>
          <TextField
            size='small'
            type='date'
            label='Desde'
            InputLabelProps={{ shrink: true }}
            value={reportRange.from}
            onChange={(e) =>
              setReportRange({ ...reportRange, from: e.target.value })
            }
          />
          <TextField
            size='small'
            type='date'
            label='Hasta'
            InputLabelProps={{ shrink: true }}
            value={reportRange.to}
            onChange={(e) =>
              setReportRange({ ...reportRange, to: e.target.value })
            }
          />
          <TextField
            size='small'
            select
            label='Tipo'
            value={filters.modality}
            onChange={(e) =>
              setFilters({ ...filters, modality: e.target.value })
            }
          >
            <MenuItem value=''>Todos</MenuItem>
            <MenuItem value='TABLE'>Mesa</MenuItem>
            <MenuItem value='TAKE_AWAY'>Para llevar</MenuItem>
            <MenuItem value='OWN_DELIVERY'>Delivery propio</MenuItem>
            <MenuItem value='EXTERNAL_COURIER'>Courier</MenuItem>
          </TextField>
          <TextField
            size='small'
            select
            label='Mesa'
            value={filters.tableId}
            onChange={(e) =>
              setFilters({ ...filters, tableId: e.target.value })
            }
          >
            <MenuItem value=''>Todas / delivery</MenuItem>
            {tables.map((x) => (
              <MenuItem key={x.id} value={x.id}>
                {x.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size='small'
            select
            label='Mozo'
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
          >
            <MenuItem value=''>Todos</MenuItem>
            {workers.map((x) => (
              <MenuItem key={x.id} value={x.id}>
                {x.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size='small'
            select
            label='Estado'
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <MenuItem value=''>Todos</MenuItem>
            <MenuItem value='OPEN'>Abierta</MenuItem>
            <MenuItem value='CLOSED'>Cerrada</MenuItem>
          </TextField>
        </div>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
          <Button
            fullWidth
            variant='contained'
            startIcon={<DownloadRoundedIcon />}
            disabled={busy || !data?.rows.length}
            onClick={() => void download()}
          >
            Descargar PDF
          </Button>
          <Button
            fullWidth
            variant='outlined'
            startIcon={<VisibilityOutlinedIcon />}
            disabled={busy || !data?.rows.length}
            onClick={() => void showFull()}
          >
            Ver reporte completo
          </Button>
        </Stack>
        {error && <Alert severity='error'>{error}</Alert>}
        <div className='command-report-summary'>
          <b>Últimas Comandas ({data?.total || 0})</b>
          <span>
            Total S/ {totals.total.toFixed(2)} · Saldo S/{' '}
            {totals.balance.toFixed(2)}
          </span>
        </div>
        {grid(preview)}
      </Card>
      <Dialog
        open={full}
        onClose={() => setFull(false)}
        fullWidth
        maxWidth='xl'
      >
        <DialogTitle>Reporte completo de Mesas y Comandas</DialogTitle>
        <DialogContent>{grid(fullRows)}</DialogContent>
        <DialogActions>
          <Button onClick={() => setFull(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(undefined)}
        fullWidth
        maxWidth='lg'
      >
        <DialogTitle>
          Detalle completo ·{' '}
          {selected &&
            `CM-${selected.account.commandNumber || selected.account.accountId.slice(0, 6)}`}
        </DialogTitle>
        <DialogContent>
          {selected && (
            <Stack gap={2}>
              <Box>
                <b>{selected.account.tables}</b> · {selected.account.waiter} ·
                Total S/ {selected.account.total} · Pagado S/{' '}
                {selected.account.paid} · Saldo S/ {selected.account.balance}
              </Box>
              <Typography fontWeight={800}>
                Productos ({selected.products.length})
              </Typography>
              <div className='command-table-wrap'>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      {[
                        'Producto',
                        'Cantidad',
                        'Precio',
                        'Descuento',
                        'Estado',
                        'Hora'
                      ].map((x) => (
                        <TableCell key={x}>{x}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selected.products.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.product}</TableCell>
                        <TableCell>{p.quantity}</TableCell>
                        <TableCell>S/ {p.appliedUnitPrice}</TableCell>
                        <TableCell>S/ {p.discount}</TableCell>
                        <TableCell>{p.status}</TableCell>
                        <TableCell>
                          {new Date(
                            p.confirmedAt || p.createdAt
                          ).toLocaleString('es-PE', { timeZone })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Typography fontWeight={800}>
                Pagos parciales ({selected.payments.length})
              </Typography>
              {selected.payments.map((p) => (
                <Box key={p.id}>
                  {p.method}: S/ {p.appliedAmount} · recibido S/{' '}
                  {p.receivedAmount} · vuelto S/ {p.changeAmount} · reembolsado
                  S/ {p.refunded}
                </Box>
              ))}
              <Typography>
                Descuento general: S/ {selected.accountDiscount}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(undefined)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
