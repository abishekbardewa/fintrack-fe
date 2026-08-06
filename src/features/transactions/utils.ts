import { SUPPORTED_CURRENCIES } from '@/lib/currencies';
import type { TransactionListParams, TransactionType } from '@/features/transactions/types';

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
