import { formatMoney } from '@/features/transactions/utils';
import type { Budget, BudgetStatus } from '@/features/budgets/types';

export { formatMoney };

export function displayLimit(budget: Budget, preferredCurrency: string) {
	const amount = budget.limitAmountPreferred ?? budget.limitAmount;
	const currency =
		budget.limitAmountPreferred != null ? preferredCurrency : budget.currency;
	return formatMoney(amount, currency);
}

export function displaySpent(budget: Budget, preferredCurrency: string) {
	const amount = budget.spentPreferred ?? budget.spent;
	const currency = budget.spentPreferred != null ? preferredCurrency : budget.currency;
	return formatMoney(amount, currency);
}

export function displayRemaining(budget: Budget) {
	return formatMoney(budget.remaining, budget.currency);
}

export function statusLabel(status: BudgetStatus) {
	switch (status) {
		case 'ok':
			return 'On track';
		case 'warning':
			return 'Near limit';
		case 'over':
			return 'Over';
	}
}

export function statusProgressClass(status: BudgetStatus) {
	switch (status) {
		case 'ok':
			return 'bg-primary';
		case 'warning':
			return 'bg-amber-500';
		case 'over':
			return 'bg-expense';
	}
}

export function monthLabel(year: number, month: number) {
	return new Intl.DateTimeFormat(undefined, {
		month: 'long',
		year: 'numeric',
	}).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function toDateInputValue(iso: string) {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '';
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

export function dateInputToWeekStartIso(dateInput: string) {
	return new Date(`${dateInput}T00:00:00.000Z`).toISOString();
}

export function currentMonthParams() {
	const now = new Date();
	return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function currentWeekStartInput() {
	const now = new Date();
	const day = now.getDay();
	const mondayOffset = day === 0 ? -6 : 1 - day;
	const monday = new Date(now);
	monday.setDate(now.getDate() + mondayOffset);
	const y = monday.getFullYear();
	const m = String(monday.getMonth() + 1).padStart(2, '0');
	const d = String(monday.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

export function shiftMonth(year: number, month: number, delta: number) {
	const date = new Date(Date.UTC(year, month - 1 + delta, 1));
	return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

export function shiftWeekStart(dateInput: string, deltaDays: number) {
	const date = new Date(`${dateInput}T00:00:00.000Z`);
	date.setUTCDate(date.getUTCDate() + deltaDays);
	const y = date.getUTCFullYear();
	const m = String(date.getUTCMonth() + 1).padStart(2, '0');
	const d = String(date.getUTCDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

export function formatWeekRange(weekStartIso: string) {
	const start = new Date(weekStartIso);
	if (Number.isNaN(start.getTime())) return weekStartIso;
	const end = new Date(start);
	end.setUTCDate(end.getUTCDate() + 6);
	const fmt = new Intl.DateTimeFormat(undefined, {
		month: 'short',
		day: 'numeric',
	});
	const yearFmt = new Intl.DateTimeFormat(undefined, { year: 'numeric' });
	return `${fmt.format(start)} – ${fmt.format(end)}, ${yearFmt.format(end)}`;
}

export function isCurrentMonth(year: number, month: number) {
	const now = currentMonthParams();
	return year === now.year && month === now.month;
}

export const MIN_BUDGET_YEAR = 2020;

export function canGoPrevMonth(year: number, month: number) {
	return year > MIN_BUDGET_YEAR || (year === MIN_BUDGET_YEAR && month > 1);
}

export function canGoNextMonth(year: number, month: number) {
	const now = currentMonthParams();
	return year < now.year || (year === now.year && month < now.month);
}

export function budgetYearOptions() {
	const { year: currentYear } = currentMonthParams();
	const years: number[] = [];
	for (let y = currentYear; y >= MIN_BUDGET_YEAR; y -= 1) {
		years.push(y);
	}
	return years;
}

export function budgetMonthOptions(year: number) {
	const now = currentMonthParams();
	const maxMonth = year === now.year ? now.month : 12;
	return Array.from({ length: maxMonth }, (_, i) => i + 1);
}

export function monthName(month: number) {
	return new Intl.DateTimeFormat(undefined, { month: 'long' }).format(
		new Date(Date.UTC(2000, month - 1, 1)),
	);
}

export function isCurrentWeek(weekStartInput: string) {
	return weekStartInput === currentWeekStartInput();
}

export function periodHeadline(params: {
	periodType: 'month' | 'week';
	year: number;
	month: number;
	weekStartInput: string;
	weekStartIso: string;
}) {
	if (params.periodType === 'month') {
		const label = monthLabel(params.year, params.month);
		return { title: label, isCurrent: isCurrentMonth(params.year, params.month) };
	}

	const range = formatWeekRange(params.weekStartIso);
	const current = isCurrentWeek(params.weekStartInput);
	if (current) {
		return { title: `This week · ${range}`, isCurrent: true };
	}
	return { title: `Week · ${range}`, isCurrent: false };
}

