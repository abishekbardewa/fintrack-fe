import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import type { ExchangeRateStatus } from '@/features/admin-exchange-rates/types';
import { cn } from '@/lib/utils';

export interface ExchangeRateFilterDraft {
	from: string;
	to: string;
	status: ExchangeRateStatus | 'all';
}

interface ExchangeRateFiltersProps {
	value: ExchangeRateFilterDraft;
	onChange: (next: ExchangeRateFilterDraft) => void;
	className?: string;
}

const STATUS_OPTIONS: { value: ExchangeRateFilterDraft['status']; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'ok', label: 'OK' },
	{ value: 'error', label: 'Error' },
	{ value: 'manual', label: 'Manual' },
];

export function ExchangeRateFilters({ value, onChange, className }: ExchangeRateFiltersProps) {
	const hasFilters = Boolean(value.from || value.to || value.status !== 'all');

	return (
		<div
			className={cn(
				'flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-xs sm:flex-row sm:flex-wrap sm:items-end',
				className,
			)}
			data-testid="exchange-rate-filters"
		>
			<div className="grid gap-1.5">
				<Label htmlFor="exchange-rate-from">From</Label>
				<Input
					id="exchange-rate-from"
					type="date"
					value={value.from}
					onChange={(e) => onChange({ ...value, from: e.target.value })}
					className="w-full sm:w-40"
					data-testid="exchange-rate-from"
				/>
			</div>

			<div className="grid gap-1.5">
				<Label htmlFor="exchange-rate-to">To</Label>
				<Input
					id="exchange-rate-to"
					type="date"
					value={value.to}
					onChange={(e) => onChange({ ...value, to: e.target.value })}
					className="w-full sm:w-40"
					data-testid="exchange-rate-to"
				/>
			</div>

			<div className="grid gap-1.5">
				<Label htmlFor="exchange-rate-status">Status</Label>
				<Select
					value={value.status}
					onValueChange={(status) =>
						onChange({ ...value, status: status as ExchangeRateFilterDraft['status'] })
					}
				>
					<SelectTrigger id="exchange-rate-status" className="w-full sm:w-36" data-testid="exchange-rate-status">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{STATUS_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{hasFilters ? (
				<Button
					type="button"
					variant="ghost"
					className="sm:mb-0.5"
					onClick={() => onChange({ from: '', to: '', status: 'all' })}
					data-testid="exchange-rate-filters-clear"
				>
					Clear
				</Button>
			) : null}
		</div>
	);
}
