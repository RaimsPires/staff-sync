/** A table of strings or numbers: first row is the header. */
export type Table = (string | number)[][];

function download(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Triggers a browser download of generated text content (CSV, JSON, etc.). */
export function downloadText(filename: string, content: string, type = "text/csv;charset=utf-8"): void {
  download(filename, new Blob([content], { type }));
}

const escapeCsv = (v: string | number) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (table: Table): string => table.map((row) => row.map(escapeCsv).join(",")).join("\n");

export function exportCsv(filename: string, table: Table): void {
  // The BOM makes Excel open UTF-8 accents correctly.
  downloadText(filename, `﻿${toCsv(table)}`);
}

export async function exportXlsx(filename: string, sheet: string, table: Table): Promise<void> {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet(table);
  ws["!cols"] = table[0].map((_, c) => ({ wch: Math.min(40, Math.max(...table.map((row) => String(row[c] ?? "").length)) + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet.slice(0, 31));
  XLSX.writeFile(wb, filename);
}

export async function exportPdf(filename: string, title: string, table: Table): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  doc.setFontSize(14);
  doc.text(title, 40, 40);
  autoTable(doc, {
    head: [table[0].map(String)],
    body: table.slice(1).map((row) => row.map(String)),
    startY: 56,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [11, 103, 221] },
  });
  doc.save(filename);
}

export type ExportFormat = "csv" | "xlsx" | "pdf";

/** Exports a table in the chosen format. */
export async function exportTable(format: ExportFormat, basename: string, title: string, table: Table): Promise<void> {
  if (format === "csv") return exportCsv(`${basename}.csv`, table);
  if (format === "xlsx") return exportXlsx(`${basename}.xlsx`, title, table);
  return exportPdf(`${basename}.pdf`, title, table);
}
