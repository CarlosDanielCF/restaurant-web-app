import { PdfMakeWrapper, Table, Txt } from 'pdfmake-wrapper';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import {
  CommandDetail,
  CommandRow,
  commandStatus,
  commandTotals,
  commandType,
  paymentStatus
} from './commandReport';

export function downloadCommandReport(
  rows: CommandRow[],
  details: CommandDetail[],
  range: { from: string; to: string },
  timeZone: string
) {
  PdfMakeWrapper.setFonts(pdfFonts as any);
  const pdf = new PdfMakeWrapper(),
    totals = commandTotals(rows);
  pdf.pageSize('A4');
  pdf.pageMargins([32, 40, 32, 38]);
  pdf.defaultStyle({ fontSize: 8 });
  pdf.header(
    new Txt('Punto Mar · Reporte de Mesas y Comandas')
      .bold()
      .fontSize(11)
      .color('#0f766e')
      .margin([32, 14, 0, 0]).end
  );
  pdf.footer(
    (current: number, total: number) =>
      new Txt(`America/Lima · Página ${current} de ${total}`)
        .alignment('center')
        .fontSize(7)
        .color('#64748b').end
  );
  pdf.add(
    new Txt('Reporte de Mesas y Comandas').bold().fontSize(18).color('#0f172a')
      .end
  );
  pdf.add(
    new Txt(`${range.from} al ${range.to} · ${timeZone}`)
      .color('#64748b')
      .margin([0, 2, 0, 12]).end
  );
  pdf.add(
    new Table([
      ['Comandas', 'Total', 'Cobrado', 'Saldo'],
      [
        String(rows.length),
        `S/ ${totals.total.toFixed(2)}`,
        `S/ ${totals.paid.toFixed(2)}`,
        `S/ ${totals.balance.toFixed(2)}`
      ]
    ])
      .widths(['*', '*', '*', '*'])
      .layout('lightHorizontalLines').end
  );
  pdf.add(new Txt('Resumen').bold().fontSize(12).margin([0, 14, 0, 6]).end);
  pdf.add(
    new Table([
      [
        'Comanda',
        'Tipo',
        'Mesa / cliente',
        'Mozo',
        'Pedidos',
        'Total',
        'Estado'
      ],
      ...rows.map((r) => [
        `CM-${r.commandNumber || r.accountId.slice(0, 6)}`,
        commandType(r.modality),
        r.tables,
        r.waiter,
        String(r.orders),
        `S/ ${r.total}`,
        `${commandStatus(r.attentionStatus)} / ${paymentStatus(r.paymentStatus)}`
      ])
    ])
      .widths([55, 45, '*', '*', 38, 55, 70])
      .layout('lightHorizontalLines').end
  );
  for (const d of details) {
    pdf.add(
      new Txt(
        `CM-${d.account.commandNumber || d.account.accountId.slice(0, 6)} · ${d.account.tables}`
      )
        .bold()
        .fontSize(12)
        .color('#0f766e')
        .pageBreak('before').end
    );
    pdf.add(
      new Txt(
        `${d.account.waiter} · Total S/ ${d.account.total} · Pagado S/ ${d.account.paid} · Saldo S/ ${d.account.balance}`
      ).margin([0, 2, 0, 8]).end
    );
    pdf.add(
      new Table([
        ['Producto', 'Cant.', 'P. unit.', 'Desc.', 'Estado', 'Hora'],
        ...d.products.map((p) => [
          p.product,
          p.quantity,
          `S/ ${p.appliedUnitPrice}`,
          `S/ ${p.discount}`,
          p.status,
          new Date(p.confirmedAt || p.createdAt).toLocaleString('es-PE', {
            timeZone
          })
        ])
      ])
        .widths(['*', 34, 45, 42, 48, 75])
        .layout('lightHorizontalLines').end
    );
    pdf.add(new Txt('Pagos').bold().margin([0, 10, 0, 4]).end);
    pdf.add(
      new Table([
        ['Método', 'Aplicado', 'Recibido', 'Vuelto', 'Reembolso', 'Hora'],
        ...d.payments.map((p) => [
          p.method,
          `S/ ${p.appliedAmount}`,
          `S/ ${p.receivedAmount}`,
          `S/ ${p.changeAmount}`,
          `S/ ${p.refunded}`,
          new Date(p.confirmedAt).toLocaleString('es-PE', { timeZone })
        ])
      ])
        .widths([48, 48, 48, 45, 52, '*'])
        .layout('lightHorizontalLines').end
    );
  }
  pdf.create().download(`punto-mar-comandas-${range.from}-${range.to}.pdf`);
}
