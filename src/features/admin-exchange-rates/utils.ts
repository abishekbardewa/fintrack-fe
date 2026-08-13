import type {
	ExchangeRateProcess,
	ExchangeRateStatus,
} from '@/features/admin-exchange-rates/types';

export function statusLabel(status: ExchangeRateStatus): string {
	switch (status) {
		case 'ok':
			return 'OK';
		case 'error':
			return 'Error';
	}
}

export function processLabel(process: ExchangeRateProcess): string {
	switch (process) {
		case 'system_cron':
			return 'System cron';
		case 'external_cron_org':
			return 'External cron.org';
		case 'admin_sync':
			return 'Admin sync';
		case 'admin_retry':
			return 'Admin retry';
		case 'admin_manual':
			return 'Admin manual';
	}
}

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function formatDate(value: string | null | undefined): string {
	if (!value) return '—';
	if (DATE_ONLY_RE.test(value)) {
		const [year, month, day] = value.split('-').map(Number);
		return new Intl.DateTimeFormat(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		}).format(new Date(year, month - 1, day));
	}
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	}).format(date);
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
	'border-sky-400/40 bg-sky-400/10 text-sky-900 dark:border-sky-400/30 dark:bg-sky-400/15 dark:text-sky-200';

