import { X } from 'lucide-react';

import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import type {
	ExchangeRateProcess,
	ExchangeRateStatus,
} from '@/features/admin-exchange-rates/types';
import { processLabel } from '@/features/admin-exchange-rates/utils';
import { formatDateInput } from '@/features/transactions/utils';
import { cn } from '@/lib/utils';

export interface ExchangeRateFilterDraft {
	from: string;
	to: string;
	status: ExchangeRateStatus | 'all';
	process: ExchangeRateProcess | 'all';
}

interface ExchangeRateFiltersProps {
	value: ExchangeRateFilterDraft;
	onChange: (next: ExchangeRateFilterDraft) => void;
	className?: string;
}

const filterControlClass =
	'h-10 min-h-10 w-auto rounded-lg border border-input/20 bg-muted py-0 text-sm font-medium shadow-xs';
const filterActiveClass =
	'border-primary/30 bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground dark:border-primary/30 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary [&_svg]:text-primary-foreground';

const STATUS_OPTIONS: { value: ExchangeRateFilterDraft['status']; label: string }[] = [
	{ value: 'all', label: 'All statuses' },
	{ value: 'ok', label: 'OK' },
	{ value: 'error', label: 'Error' },
];

const PROCESS_OPTIONS: { value: ExchangeRateFilterDraft['process']; label: string }[] = [
	{ value: 'all', label: 'All processes' },
	{ value: 'system_cron', label: processLabel('system_cron') },
	{ value: 'external_cron_org', label: processLabel('external_cron_org') },
	{ value: 'admin_sync', label: processLabel('admin_sync') },
	{ value: 'admin_retry', label: processLabel('admin_retry') },
	{ value: 'admin_manual', label: processLabel('admin_manual') },
];

export function ExchangeRateFilters({ value, onChange, className }: ExchangeRateFiltersProps) {
	const dateActive = Boolean(value.from || value.to);
	const statusActive = value.status !== 'all';
	const processActive = value.process !== 'all';

	const dateChipLabel =
		value.from || value.to
			? `${value.from ? formatDateInput(value.from) : '…'} – ${
					value.to ? formatDateInput(value.to) : '…'
				}`
			: null;

	return (
		<div
			className={cn('flex flex-wrap items-center gap-2', className)}
			role="search"
			aria-label="Exchange rate filters"
			data-testid="exchange-rate-filters"
		>
			<DateRangePicker
				from={value.from}
				to={value.to}
				onChange={({ from, to }) => onChange({ ...value, from, to })}
				placeholder="Date range"
				className={cn('w-auto min-w-40', filterControlClass, dateActive && filterActiveClass)}
				aria-label="Date range"
			/>

			<Select
				value={value.status}
				onValueChange={(status) =>
					onChange({ ...value, status: status as ExchangeRateFilterDraft['status'] })
				}
			>
				<SelectTrigger
					className={cn('min-w-32', filterControlClass, statusActive && filterActiveClass)}
					aria-label="Status"
					data-testid="exchange-rate-status"
				>
					<SelectValue placeholder="Status" />
				</SelectTrigger>
				<SelectContent>
					{STATUS_OPTIONS.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				value={value.process}
				onValueChange={(process) =>
					onChange({ ...value, process: process as ExchangeRateFilterDraft['process'] })
				}
			>
				<SelectTrigger
					className={cn('min-w-40', filterControlClass, processActive && filterActiveClass)}
					aria-label="Process"
					data-testid="exchange-rate-process"
				>
					<SelectValue placeholder="Process" />
				</SelectTrigger>
				<SelectContent>
					{PROCESS_OPTIONS.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{dateChipLabel ? (
				<span
					className="inline-flex h-8 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 text-sm text-primary"
					data-testid="exchange-rate-applied-date"
				>
					<span className="max-w-56 truncate">{dateChipLabel}</span>
					<button
						type="button"
						onClick={() => onChange({ ...value, from: '', to: '' })}
						className="inline-flex size-5 items-center justify-center rounded-full text-primary/80 transition-colors hover:bg-primary/15 hover:text-primary"
						aria-label="Clear date range"
					>
						<X className="size-3.5" />
					</button>
				</span>
			) : null}
		</div>
	);
}
