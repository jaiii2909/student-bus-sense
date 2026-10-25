// Minimal CSV reader: commas, "quoted, fields", "" for a quote inside quotes,
// and \n or \r\n line endings. Blank lines are dropped.
export const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  row.push(field);
  rows.push(row);

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
};

// "2026-06-30" from a date input -> end of that day in the user's time zone, as ISO
export const endOfDayIso = (dateInput: string) => (dateInput ? new Date(`${dateInput}T23:59:59`).toISOString() : null);

// ISO date -> "2026-06-30" for a date input
export const toDateInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// One CSV cell: quoted when needed, and text that Excel would run as a formula
// (starting with = + - @) gets a leading ' so it stays plain text.
const toCell = (value: string | number | null | undefined) => {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCsv = (rows: (string | number | null | undefined)[][]) =>
  rows.map((row) => row.map(toCell).join(",")).join("\r\n");

// downloads rows as a .csv file (with a BOM so Excel shows Hindi names correctly)
export const downloadCsv = (filename: string, rows: (string | number | null | undefined)[][]) => {
  const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
