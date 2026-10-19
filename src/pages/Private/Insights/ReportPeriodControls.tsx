import { Button, Stack, TextField } from '@mui/material';
import {
  DateRange,
  periodLabels,
  periodRange,
  ReportPeriod
} from './reportView';
export function ReportPeriodControls({
  period,
  range,
  timeZone,
  disabled = false,
  onChange
}: {
  period: ReportPeriod;
  range: DateRange;
  timeZone: string;
  disabled?: boolean;
  onChange: (period: ReportPeriod, range: DateRange) => void;
}) {
  return (
    <Stack spacing={1}>
      <Stack
        direction='row'
        gap={0.5}
        flexWrap='wrap'
        aria-label='Período del reporte'
      >
        {(Object.keys(periodLabels) as ReportPeriod[]).map((p) => (
          <Button
            key={p}
            size='small'
            variant={period === p ? 'contained' : 'text'}
            aria-pressed={period === p}
            disabled={disabled}
            onClick={() =>
              onChange(p, p === 'custom' ? range : periodRange(p, timeZone))
            }
          >
            {periodLabels[p]}
          </Button>
        ))}
      </Stack>
      {period === 'custom' && (
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
          <TextField
            type='date'
            size='small'
            label='Desde'
            InputLabelProps={{ shrink: true }}
            value={range.from}
            disabled={disabled}
            onChange={(e) =>
              onChange('custom', { ...range, from: e.target.value })
            }
          />
          <TextField
            type='date'
            size='small'
            label='Hasta'
            InputLabelProps={{ shrink: true }}
            value={range.to}
            disabled={disabled}
            onChange={(e) =>
              onChange('custom', { ...range, to: e.target.value })
            }
          />
        </Stack>
      )}
    </Stack>
  );
}
