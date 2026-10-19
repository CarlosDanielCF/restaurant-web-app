/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  ts = require('typescript'),
  vm = require('node:vm');
const scope = { exports: {}, Intl, Date, URLSearchParams };
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync('src/pages/Private/Insights/reportView.ts', 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } }
  ).outputText,
  scope
);
const {
  periodRange,
  restaurantDate,
  validReportRange,
  reportAmount,
  reportLink,
  reportNames,
  reportGroups
} = scope.exports;
const plain = (value) => JSON.parse(JSON.stringify(value));
test('report periods use restaurant calendar rather than browser date across timezone/midnight', () => {
  const now = new Date('2026-10-19T02:15:00Z');
  assert.equal(restaurantDate('America/Lima', now), '2026-10-18');
  assert.deepEqual(plain(periodRange('today', 'America/Lima', now)), {
    from: '2026-10-18',
    to: '2026-10-18'
  });
  assert.deepEqual(plain(periodRange('yesterday', 'Europe/Madrid', now)), {
    from: '2026-10-18',
    to: '2026-10-18'
  });
  assert.deepEqual(plain(periodRange('week', 'America/Lima', now)), {
    from: '2026-10-12',
    to: '2026-10-18'
  });
  assert.deepEqual(plain(periodRange('month', 'America/Lima', now)), {
    from: '2026-10-01',
    to: '2026-10-18'
  });
});
test('calendar shortcuts survive leap days, DST and year boundaries', () => {
  assert.deepEqual(
    plain(
      periodRange(
        'yesterday',
        'Europe/Madrid',
        new Date('2024-03-01T12:00:00Z')
      )
    ),
    { from: '2024-02-29', to: '2024-02-29' }
  );
  assert.deepEqual(
    plain(
      periodRange('week', 'Europe/Madrid', new Date('2026-03-29T12:00:00Z'))
    ),
    { from: '2026-03-23', to: '2026-03-29' }
  );
  assert.deepEqual(
    plain(periodRange('yesterday', 'UTC', new Date('2026-01-01T12:00:00Z'))),
    { from: '2025-12-31', to: '2025-12-31' }
  );
});
test('ranges reject invalid days, backwards dates and more than 366 calendar days', () => {
  assert.equal(
    validReportRange({ from: '2024-01-01', to: '2024-12-31' }),
    true
  );
  for (const range of [
    { from: '2024-01-01', to: '2025-01-01' },
    { from: '2026-02-30', to: '2026-03-01' },
    { from: '2026-05-02', to: '2026-05-01' },
    { from: '', to: '2026-01-01' }
  ])
    assert.equal(validReportRange(range), false);
});
test('decimal money is displayed without floating point loss or client total recomputation', () => {
  assert.equal(reportAmount('1760.00'), 'S/ 1,760.00');
  assert.equal(reportAmount('-0.01'), 'S/ -0.01');
  assert.equal(
    reportAmount('9007199254740993.19', 'USD'),
    'USD 9,007,199,254,740,993.19'
  );
  assert.equal(reportAmount(null), '—');
});
test('report links preserve period and collector context; all named reports have a navigation group', () => {
  const link = reportLink(
    'collections',
    { from: '2026-10-01', to: '2026-10-19' },
    { userId: 'worker&one' }
  );
  const params = new URLSearchParams(link.split('?')[1]);
  assert.equal(params.get('userId'), 'worker&one');
  assert.equal(params.get('from'), '2026-10-01');
  for (const kind of Object.keys(reportNames))
    assert.ok(
      reportGroups.some((g) => g.kinds.includes(kind)),
      kind
    );
});
test('report errors preserve interceptor response and validation-array messages', () => {
  const { reportError } = scope.exports;
  assert.equal(
    reportError({ data: { message: 'Excede 10000 filas' } }, 'fallback'),
    'Excede 10000 filas'
  );
  assert.equal(
    reportError(
      {
        response: { data: { message: ['Rango inválido', 'Máximo 366 días'] } }
      },
      'fallback'
    ),
    'Rango inválido · Máximo 366 días'
  );
  assert.equal(reportError(new Error('network'), 'Reintentar'), 'Reintentar');
});
test('operating dates remain calendar dates rather than moving five hours into yesterday', () => {
  const { displayOperatingDate } = scope.exports;
  assert.equal(displayOperatingDate('2026-10-19'), '19/10/2026');
  assert.equal(displayOperatingDate('2026-10-19T00:00:00.000Z'), '19/10/2026');
  assert.equal(displayOperatingDate('2024-02-29T00:00:00Z'), '29/02/2024');
  for (const value of [null, '', '2026-02-30', '2026-10-19T15:45:00Z'])
    assert.equal(displayOperatingDate(value), '—');
});
test('unit display strips storage zeros while preserving meaningful decimal precision', () => {
  const { displayUnits } = scope.exports;
  for (const [raw, expected] of [
    ['1.000', '1'],
    ['0.000', '0'],
    ['-3.000', '-3'],
    ['2.500', '2.5'],
    ['0.125', '0.125'],
    ['-0.000', '0'],
    ['9007199254740993.125', '9007199254740993.125']
  ])
    assert.equal(displayUnits(raw), expected);
  for (const value of [null, undefined, '', '1e3', 'NaN'])
    assert.equal(displayUnits(value), '—');
});
