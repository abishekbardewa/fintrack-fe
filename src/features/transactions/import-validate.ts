import type { Category } from '@/features/categories/types';
import type { ImportColumnKey } from '@/features/transactions/import-parse';
import type {
	ImportTransactionRowRequest,
	TransactionType,
} from '@/features/transactions/types';
import { dateInputToIso } from '@/features/transactions/utils';
import { SUPPORTED_CURRENCIES } from '@/lib/currencies';

export type ImportFieldKey = ImportColumnKey;

export interface ImportDraftRow {
	id: string;
	sourceIndex: number;
	date: string;
	type: string;
	category: string;
	categoryId: string;
	subcategory: string;
	subcategoryId: string;
	amount: string;
	currency: string;
	description: string;
	errors: Partial<Record<ImportFieldKey, string>>;
}

function normName(value: string) {
	return value.trim().toLowerCase();
}

function isValidDateInput(value: string) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const [y, m, d] = value.split('-').map(Number);
	const date = new Date(y, m - 1, d);
	return (
		date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
	);
}

export function createDraftRowId() {
	return `import-${crypto.randomUUID()}`;
}

export function rawToDraftRow(
	raw: {
		date: string;
		type: string;
		category: string;
		subcategory: string;
		amount: string;
		currency: string;
		description: string;
		sourceIndex: number;
	},
	preferredCurrency: string,
): ImportDraftRow {
	return {
		id: createDraftRowId(),
		sourceIndex: raw.sourceIndex,
		date: raw.date,
		type: raw.type.trim().toLowerCase(),
		category: raw.category.trim(),
		categoryId: '',
		subcategory: raw.subcategory.trim(),
		subcategoryId: '',
		amount: raw.amount.trim(),
		currency: raw.currency.trim() || preferredCurrency,
		description: raw.description.trim(),
		errors: {},
	};
}

export function validateImportRow(
	row: ImportDraftRow,
	categories: Category[],
	preferredCurrency: string,
): ImportDraftRow {
	const errors: Partial<Record<ImportFieldKey, string>> = {};
	const type = row.type.trim().toLowerCase();

	if (!row.date.trim()) {
		errors.date = 'Date is required';
	} else if (!isValidDateInput(row.date.trim())) {
		errors.date = 'Use YYYY-MM-DD';
	}

	if (type !== 'expense' && type !== 'income') {
		errors.type = 'Must be expense or income';
	}

	const mains = categories.filter(
		(c) => c.parentCategoryId == null && (type === 'expense' || type === 'income' ? c.kind === type : true),
	);

	let categoryId = row.categoryId;
	let categoryName = row.category.trim();
	let subcategoryId = row.subcategoryId;
	let subcategoryName = row.subcategory.trim();

	if (!categoryName && !categoryId) {
		errors.category = 'Category is required';
	} else if (type === 'expense' || type === 'income') {
		const byId = categoryId ? mains.find((c) => c.id === categoryId) : undefined;
		const byName = categoryName
			? mains.find((c) => normName(c.name) === normName(categoryName))
			: undefined;
		const main = byId ?? byName;
		if (!main) {
			errors.category = 'Unknown category';
			categoryId = '';
		} else {
			categoryId = main.id;
			categoryName = main.name;
		}

		if (subcategoryName || subcategoryId) {
			if (!main) {
				errors.subcategory = 'Pick a category first';
				subcategoryId = '';
			} else {
				const children = categories.filter((c) => c.parentCategoryId === main.id);
				const subById = subcategoryId
					? children.find((c) => c.id === subcategoryId)
					: undefined;
				const subByName = subcategoryName
					? children.find((c) => normName(c.name) === normName(subcategoryName))
					: undefined;
				const sub = subById ?? subByName;
				if (!sub) {
					errors.subcategory = 'Unknown subcategory';
					subcategoryId = '';
				} else {
					subcategoryId = sub.id;
					subcategoryName = sub.name;
				}
			}
		} else {
			subcategoryId = '';
			subcategoryName = '';
		}
	}

	const amountRaw = row.amount.trim().replace(/,/g, '');
	const amount = Number(amountRaw);
	if (!amountRaw) {
		errors.amount = 'Amount is required';
	} else if (!Number.isFinite(amount) || amount <= 0) {
		errors.amount = 'Amount must be greater than 0';
	}

	const currency = (row.currency.trim() || preferredCurrency).toUpperCase();
	if (!SUPPORTED_CURRENCIES.some((c) => c.code === currency)) {
		errors.currency = 'Unsupported currency';
	}

	if (row.description.length > 500) {
		errors.description = 'Max 500 characters';
	}

	return {
		...row,
		type,
		category: categoryName,
		categoryId,
		subcategory: subcategoryName,
		subcategoryId,
		currency,
		errors,
	};
}

export function validateImportRows(
	rows: ImportDraftRow[],
	categories: Category[],
	preferredCurrency: string,
) {
	return rows.map((row) => validateImportRow(row, categories, preferredCurrency));
}

export function sortImportRows(rows: ImportDraftRow[]) {
	return [...rows].sort((a, b) => {
		const aErr = Object.keys(a.errors).length > 0 ? 0 : 1;
		const bErr = Object.keys(b.errors).length > 0 ? 0 : 1;
		if (aErr !== bErr) return aErr - bErr;
		return a.sourceIndex - b.sourceIndex;
	});
}

export function rowHasErrors(row: ImportDraftRow) {
	return Object.keys(row.errors).length > 0;
}

export function draftRowsToPayload(
	rows: ImportDraftRow[],
): ImportTransactionRowRequest[] {
	return rows.map((row) => ({
		date: dateInputToIso(row.date),
		type: row.type as TransactionType,
		categoryId: row.categoryId,
		subcategoryId: row.subcategoryId || null,
		amount: Number(row.amount.trim().replace(/,/g, '')),
		currency: row.currency,
		description: row.description.trim() || undefined,
	}));
}

const DETAIL_FIELD_RE = /^transactions\[(\d+)\]\.(.+)$/;

const DETAIL_FIELD_MAP: Record<string, ImportFieldKey> = {
	date: 'date',
	type: 'type',
	categoryId: 'category',
	category: 'category',
	subcategoryId: 'subcategory',
	subcategory: 'subcategory',
	amount: 'amount',
	currency: 'currency',
	description: 'description',
};

export function applyImportApiDetails(
	rows: ImportDraftRow[],
	details: { field: string; message: string }[] | undefined,
): ImportDraftRow[] {
	if (!details?.length) return rows;

	const next = rows.map((row) => ({ ...row, errors: { ...row.errors } }));

	for (const detail of details) {
		const match = DETAIL_FIELD_RE.exec(detail.field);
		if (!match) continue;
		const index = Number(match[1]);
		const mapped = DETAIL_FIELD_MAP[match[2]];
		if (!mapped || !next[index] || next[index].errors[mapped]) continue;
		next[index].errors[mapped] = detail.message;
	}

	return next;
}
