import * as XLSX from 'xlsx';

import { toDateInputValue } from '@/features/transactions/utils';

export const IMPORT_MAX_ROWS = 100;

export type ImportColumnKey =
	| 'date'
	| 'type'
	| 'category'
	| 'subcategory'
	| 'amount'
	| 'currency'
	| 'description';

export interface RawImportRow {
	date: string;
	type: string;
	category: string;
	subcategory: string;
	amount: string;
	currency: string;
	description: string;
	sourceIndex: number;
}

export interface ParseImportResult {
	rows: RawImportRow[];
	truncated: number;
	error?: string;
}

const COLUMN_ALIASES: Record<string, ImportColumnKey> = {
	date: 'date',
	type: 'type',
	category: 'category',
	subcategory: 'subcategory',
	amount: 'amount',
	currency: 'currency',
	note: 'description',
};

function normalizeHeader(value: string) {
	return value
		.trim()
		.toLowerCase()
		.replace(/\s*\(optional\)\s*$/i, '')
		.replace(/\s+/g, ' ');
}

function cellToString(value: unknown): string {
	if (value == null) return '';
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return toDateInputValue(value.toISOString());
	}
	if (typeof value === 'number' && Number.isFinite(value)) {
		return String(value);
	}
	return String(value).trim();
}

function excelSerialToDateInput(serial: number): string | null {
	if (!Number.isFinite(serial) || serial < 1) return null;
	const parsed = XLSX.SSF.parse_date_code(serial);
	if (!parsed) return null;
	const y = String(parsed.y).padStart(4, '0');
	const m = String(parsed.m).padStart(2, '0');
	const d = String(parsed.d).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

function normalizeDateCell(value: unknown): string {
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return toDateInputValue(value.toISOString());
	}
	if (typeof value === 'number' && Number.isFinite(value)) {
		return excelSerialToDateInput(value) ?? String(value);
	}
	const text = cellToString(value);
	if (!text) return '';

	const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
	if (isoMatch) {
		const y = isoMatch[1];
		const m = isoMatch[2].padStart(2, '0');
		const d = isoMatch[3].padStart(2, '0');
		return `${y}-${m}-${d}`;
	}

	const slashMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text);
	if (slashMatch) {
		const d = slashMatch[1].padStart(2, '0');
		const m = slashMatch[2].padStart(2, '0');
		const y = slashMatch[3];
		return `${y}-${m}-${d}`;
	}

	return text;
}

function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let i = 0; i < text.length; i += 1) {
		const ch = text[i];
		const next = text[i + 1];

		if (inQuotes) {
			if (ch === '"' && next === '"') {
				current += '"';
				i += 1;
			} else if (ch === '"') {
				inQuotes = false;
			} else {
				current += ch;
			}
			continue;
		}

		if (ch === '"') {
			inQuotes = true;
			continue;
		}
		if (ch === ',') {
			row.push(current);
			current = '';
			continue;
		}
		if (ch === '\n') {
			row.push(current);
			rows.push(row);
			row = [];
			current = '';
			continue;
		}
		if (ch === '\r') {
			continue;
		}
		current += ch;
	}

	if (current.length > 0 || row.length > 0) {
		row.push(current);
		rows.push(row);
	}

	return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''));
}

function mapMatrix(matrix: unknown[][]): ParseImportResult {
	if (matrix.length < 2) {
		return { rows: [], truncated: 0, error: 'File needs a header row and at least one data row.' };
	}

	const headerCells = matrix[0].map((cell) => normalizeHeader(cellToString(cell)));
	const columnIndex = new Map<ImportColumnKey, number>();

	headerCells.forEach((header, index) => {
		const key = COLUMN_ALIASES[header];
		if (key && !columnIndex.has(key)) {
			columnIndex.set(key, index);
		}
	});

	const required: ImportColumnKey[] = ['date', 'type', 'category', 'amount'];
	const missing = required.filter((key) => !columnIndex.has(key));
	if (missing.length > 0) {
		return {
			rows: [],
			truncated: 0,
			error: `Missing columns: ${missing.join(', ')}.`,
		};
	}

	const dataRows = matrix.slice(1).filter((cells) =>
		cells.some((cell) => cellToString(cell) !== ''),
	);
	if (dataRows.length === 0) {
		return {
			rows: [],
			truncated: 0,
			error: 'File needs a header row and at least one data row.',
		};
	}
	const truncated = Math.max(0, dataRows.length - IMPORT_MAX_ROWS);
	const limited = dataRows.slice(0, IMPORT_MAX_ROWS);

	const rows: RawImportRow[] = limited.map((cells, index) => {
		const read = (key: ImportColumnKey) => {
			const col = columnIndex.get(key);
			if (col == null) return '';
			const value = cells[col];
			if (key === 'date') return normalizeDateCell(value);
			return cellToString(value);
		};

		return {
			date: read('date'),
			type: read('type'),
			category: read('category'),
			subcategory: read('subcategory'),
			amount: read('amount'),
			currency: read('currency'),
			description: read('description'),
			sourceIndex: index + 1,
		};
	});

	return { rows, truncated };
}

export async function parseImportFile(file: File): Promise<ParseImportResult> {
	const name = file.name.toLowerCase();
	const isCsv = name.endsWith('.csv') || file.type === 'text/csv';
	const isXlsx =
		name.endsWith('.xlsx') ||
		name.endsWith('.xls') ||
		file.type.includes('spreadsheet') ||
		file.type.includes('excel');

	if (!isCsv && !isXlsx) {
		return { rows: [], truncated: 0, error: 'Use a CSV or Excel (.xlsx) file.' };
	}

	try {
		if (isCsv) {
			const text = await file.text();
			return mapMatrix(parseCsv(text));
		}

		const buffer = await file.arrayBuffer();
		const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
		const sheetName = workbook.SheetNames[0];
		if (!sheetName) {
			return { rows: [], truncated: 0, error: 'Workbook has no sheets.' };
		}
		const sheet = workbook.Sheets[sheetName];
		const matrix = XLSX.utils.sheet_to_json<(string | number | Date | null)[]>(sheet, {
			header: 1,
			defval: '',
			raw: true,
		});
		return mapMatrix(matrix);
	} catch {
		return { rows: [], truncated: 0, error: 'Could not read that file.' };
	}
}
