import { SUPPORTED_CURRENCIES } from '@/lib/currencies';
import type {
	TransactionExportFormat,
	TransactionExportParams,
	TransactionExportPreset,
	TransactionListParams,
	TransactionType,
} from '@/features/transactions/types';

const DATE_INPUT_RE = /^\d{4}-\d{2}-\d{2}$/;

export function currencySymbol(code: string) {
	return SUPPORTED_CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

export function formatMoney(amount: number, currency: string) {
	const symbol = currencySymbol(currency);
	const formatted = new Intl.NumberFormat(undefined, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(amount);
	return `${symbol}${formatted}`;
}

export function toDateInputValue(iso: string) {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '';
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

export function dateInputToIso(dateInput: string) {
	return new Date(`${dateInput}T00:00:00.000Z`).toISOString();
}

export function formatDisplayDate(iso: string) {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	return new Intl.DateTimeFormat(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	}).format(date);
}

export function formatDateInput(dateInput: string) {
	if (!DATE_INPUT_RE.test(dateInput)) return dateInput;
	const [year, month, day] = dateInput.split('-').map(Number);
	return new Intl.DateTimeFormat(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	}).format(new Date(year, month - 1, day));
}

export function todayDateInput() {
	return toDateInputValue(new Date().toISOString());
}

export type TransactionFilterDraft = {
	q: string;
	type: TransactionType | '';
	categoryId: string;
	subcategoryId: string;
	from: string;
	to: string;
	currency: string;
	minAmount: string;
	maxAmount: string;
};

export const EMPTY_FILTERS: TransactionFilterDraft = {
	q: '',
	type: '',
	categoryId: '',
	subcategoryId: '',
	from: '',
	to: '',
	currency: '',
	minAmount: '',
	maxAmount: '',
};

export function draftToParams(
	draft: TransactionFilterDraft,
	page: number,
	limit: number,
): TransactionListParams {
	const minAmount = draft.minAmount.trim() === '' ? undefined : Number(draft.minAmount);
	const maxAmount = draft.maxAmount.trim() === '' ? undefined : Number(draft.maxAmount);

	return {
		q: draft.q.trim() || undefined,
		type: draft.type || undefined,
		categoryId: draft.categoryId || undefined,
		subcategoryId: draft.subcategoryId || undefined,
		from: draft.from ? new Date(`${draft.from}T00:00:00.000Z`).toISOString() : undefined,
		to: draft.to ? new Date(`${draft.to}T23:59:59.999Z`).toISOString() : undefined,
		currency: draft.currency || undefined,
		minAmount: Number.isFinite(minAmount) ? minAmount : undefined,
		maxAmount: Number.isFinite(maxAmount) ? maxAmount : undefined,
		page,
		limit,
	};
}

export function hasActiveFilters(draft: TransactionFilterDraft) {
	return Object.values(draft).some((v) => v !== '');
}

export function describeActiveFilters(
	draft: TransactionFilterDraft,
	categoryLabels?: Map<string, string>,
) {
	const parts: string[] = [];

	if (draft.from || draft.to) {
		const from = draft.from ? formatDateInput(draft.from) : '…';
		const to = draft.to ? formatDateInput(draft.to) : '…';
		parts.push(`${from} – ${to}`);
	}
	if (draft.type === 'income') parts.push('Income');
	if (draft.type === 'expense') parts.push('Expense');
	if (draft.categoryId) {
		parts.push(categoryLabels?.get(draft.categoryId) ?? 'Category');
	}
	if (draft.subcategoryId) {
		parts.push(categoryLabels?.get(draft.subcategoryId) ?? 'Subcategory');
	}
	if (draft.q.trim()) parts.push(`"${draft.q.trim()}"`);
	if (draft.currency) parts.push(draft.currency);
	if (draft.minAmount.trim() || draft.maxAmount.trim()) {
		const min = draft.minAmount.trim() || '0';
		const max = draft.maxAmount.trim() || '…';
		parts.push(`${min}–${max}`);
	}

	return parts.length > 0 ? `Showing ${parts.join(' · ')}` : '';
}

const FILTER_QUERY_KEYS = [
	'from',
	'to',
	'type',
	'categoryId',
	'subcategoryId',
	'currency',
	'q',
	'minAmount',
	'maxAmount',
] as const;

function parseDateParam(value: string | null) {
	if (!value) return '';
	if (DATE_INPUT_RE.test(value)) return value;
	return toDateInputValue(value);
}

export function filtersFromSearchParams(params: URLSearchParams): TransactionFilterDraft {
	const type = params.get('type');
	return {
		q: params.get('q') ?? '',
		type: type === 'income' || type === 'expense' ? type : '',
		categoryId: params.get('categoryId') ?? '',
		subcategoryId: params.get('subcategoryId') ?? '',
		from: parseDateParam(params.get('from')),
		to: parseDateParam(params.get('to')),
		currency: params.get('currency') ?? '',
		minAmount: params.get('minAmount') ?? '',
		maxAmount: params.get('maxAmount') ?? '',
	};
}

export type TransactionsHrefFilters = Partial<
	Pick<TransactionFilterDraft, 'from' | 'to' | 'type' | 'categoryId' | 'subcategoryId'>
>;

export function buildTransactionsHref(filters: TransactionsHrefFilters = {}) {
	const params = new URLSearchParams();
	if (filters.from) params.set('from', filters.from);
	if (filters.to) params.set('to', filters.to);
	if (filters.type) params.set('type', filters.type);
	if (filters.categoryId) params.set('categoryId', filters.categoryId);
	if (filters.subcategoryId) params.set('subcategoryId', filters.subcategoryId);
	const query = params.toString();
	return query ? `/transactions?${query}` : '/transactions';
}

export function writeFiltersToSearchParams(
	params: URLSearchParams,
	draft: TransactionFilterDraft,
) {
	const next = new URLSearchParams(params);
	for (const key of FILTER_QUERY_KEYS) {
		next.delete(key);
	}
	if (draft.q.trim()) next.set('q', draft.q.trim());
	if (draft.type) next.set('type', draft.type);
	if (draft.categoryId) next.set('categoryId', draft.categoryId);
	if (draft.subcategoryId) next.set('subcategoryId', draft.subcategoryId);
	if (draft.from) next.set('from', draft.from);
	if (draft.to) next.set('to', draft.to);
	if (draft.currency) next.set('currency', draft.currency);
	if (draft.minAmount.trim()) next.set('minAmount', draft.minAmount.trim());
	if (draft.maxAmount.trim()) next.set('maxAmount', draft.maxAmount.trim());
	return next;
}

export const EXPORT_MAX_RANGE_DAYS = 730;

export const EXPORT_COLUMNS = [
	'date',
	'type',
	'category',
	'subcategory',
	'amount',
	'currency',
	'amountPreferred',
	'description',
] as const;

export const EXPORT_PRESETS: { value: TransactionExportPreset; label: string; hint: string }[] = [
	{ value: 'this_month', label: 'This month', hint: 'Current calendar month' },
	{ value: 'last_month', label: 'Last month', hint: 'Previous calendar month' },
	{ value: 'last_3_months', label: 'Last 3 months', hint: 'Including this month' },
];

export function exportPresetLabel(preset: TransactionExportPreset) {
	return EXPORT_PRESETS.find((p) => p.value === preset)?.label ?? preset;
}

function monthYearLabel(year: number, monthIndex: number) {
	return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(
		new Date(year, monthIndex, 1),
	);
}

export function exportPresetRangeLabel(preset: TransactionExportPreset, now = new Date()) {
	const year = now.getFullYear();
	const month = now.getMonth();

	if (preset === 'this_month') {
		return monthYearLabel(year, month);
	}

	if (preset === 'last_month') {
		const previous = new Date(year, month - 1, 1);
		return monthYearLabel(previous.getFullYear(), previous.getMonth());
	}

	const start = new Date(year, month - 2, 1);
	return `${monthYearLabel(start.getFullYear(), start.getMonth())} – ${monthYearLabel(year, month)}`;
}

export function exportDateRangeDays(from: string, to: string) {
	const start = new Date(`${from}T00:00:00.000Z`).getTime();
	const end = new Date(`${to}T00:00:00.000Z`).getTime();
	if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
	return Math.floor((end - start) / 86_400_000) + 1;
}

export function exportFilteredRangeError(draft: TransactionFilterDraft) {
	if (!draft.from || !draft.to) {
		return 'Set a date range to export filtered transactions.';
	}
	const days = exportDateRangeDays(draft.from, draft.to);
	if (days == null) {
		return 'Invalid date range.';
	}
	if (days > EXPORT_MAX_RANGE_DAYS) {
		return 'Export range cannot exceed 2 years. Narrow the date range.';
	}
	return null;
}

export function filtersToExportParams(
	draft: TransactionFilterDraft,
	format: TransactionExportFormat,
): TransactionExportParams {
	const minAmount = draft.minAmount.trim() === '' ? undefined : Number(draft.minAmount);
	const maxAmount = draft.maxAmount.trim() === '' ? undefined : Number(draft.maxAmount);

	return {
		format,
		from: draft.from ? new Date(`${draft.from}T00:00:00.000Z`).toISOString() : undefined,
		to: draft.to ? new Date(`${draft.to}T23:59:59.999Z`).toISOString() : undefined,
		q: draft.q.trim() || undefined,
		type: draft.type || undefined,
		categoryId: draft.categoryId || undefined,
		subcategoryId: draft.subcategoryId || undefined,
		currency: draft.currency || undefined,
		minAmount: Number.isFinite(minAmount) ? minAmount : undefined,
		maxAmount: Number.isFinite(maxAmount) ? maxAmount : undefined,
	};
}

export function triggerFileDownload(blob: Blob, filename: string) {
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
