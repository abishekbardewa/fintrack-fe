import * as XLSX from 'xlsx';

export const IMPORT_TEMPLATE_HEADERS = [
	'date',
	'type',
	'category',
	'subcategory (optional)',
	'amount',
	'currency (optional)',
	'description (optional)',
] as const;

export const IMPORT_TEMPLATE_SAMPLE_ROWS = [
	['2026-08-01', 'income', 'Salary', '', '85000', 'INR', 'Monthly salary'],
	['2026-08-04', 'expense', 'Food', 'Groceries', '500', 'INR', 'Weekly veggies'],
	['2026-08-05', 'expense', 'Transport', '', '120', 'INR', 'Metro top-up'],
	['2026-08-06', 'expense', 'Bills', 'Electricity', '3200', '', ''],
	['2026-08-07', 'expense', 'Shopping', '', '1899', 'INR', 'Online order'],
	['2026-08-08', 'income', 'Side income', '', '12000', 'INR', 'Freelance invoice'],
] as const;

export const IMPORT_TEMPLATE_CSV_FILENAME = 'fintrack-transactions-import-template.csv';
export const IMPORT_TEMPLATE_XLSX_FILENAME = 'fintrack-transactions-import-template.xlsx';

function csvEscape(value: string) {
	if (/[",\n\r]/.test(value)) {
		return `"${value.replaceAll('"', '""')}"`;
	}
	return value;
}

export function buildImportTemplateCsv() {
	const header = IMPORT_TEMPLATE_HEADERS.map(csvEscape).join(',');
	const rows = IMPORT_TEMPLATE_SAMPLE_ROWS.map((row) => row.map(csvEscape).join(','));
	return `${[header, ...rows].join('\n')}\n`;
}

function triggerDownload(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	anchor.rel = 'noopener';
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(url);
}

export function downloadImportTemplateCsv() {
	const blob = new Blob([buildImportTemplateCsv()], { type: 'text/csv;charset=utf-8' });
	triggerDownload(blob, IMPORT_TEMPLATE_CSV_FILENAME);
}

export function downloadImportTemplateXlsx() {
	const sheet = XLSX.utils.aoa_to_sheet([
		[...IMPORT_TEMPLATE_HEADERS],
		...IMPORT_TEMPLATE_SAMPLE_ROWS.map((row) => [...row]),
	]);
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, sheet, 'Transactions');
	const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
	triggerDownload(
		new Blob([buffer], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		}),
		IMPORT_TEMPLATE_XLSX_FILENAME,
	);
}
