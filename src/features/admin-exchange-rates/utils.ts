import type { ExchangeRateStatus, SyncLogType } from '@/features/admin-exchange-rates/types';

export function statusLabel(status: ExchangeRateStatus): string {
	switch (status) {
		case 'ok':
			return 'OK';
		case 'error':
			return 'Error';
		case 'manual':
			return 'Manual';
	}
}

export function sourceLabel(source: string): string {
	switch (source) {
		case 'frankfurter':
			return 'Frankfurter';
		case 'manual':
			return 'Manual';
		case 'admin_retry':
			return 'Retry';
		default:
			return source;
	}
}

export function syncLogTypeLabel(type: SyncLogType): string {
	switch (type) {
		case 'daily_cron':
			return 'Daily cron';
		case 'retry_date':
			return 'Retry';
		case 'manual':
			return 'Manual';
	}
}

export function formatDateTime(value: string | null | undefined): string {
	if (!value) return '—';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

export function sortedRateEntries(
	rates: Record<string, number>,
	base: string,
): { code: string; value: number }[] {
	return Object.keys(rates)
		.filter((code) => code !== base)
		.sort()
		.map((code) => ({ code, value: rates[code]! }));
}

export const RATE_BADGE_CLASS =
	'border-violet-500/30 bg-violet-500/15 text-violet-700 dark:text-violet-300';
