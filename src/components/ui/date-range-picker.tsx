import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

function parseDateInput(value: string): Date | undefined {
	if (!value) return undefined;
	const [y, m, d] = value.split('-').map(Number);
	if (!y || !m || !d) return undefined;
	const date = new Date(y, m - 1, d);
	if (Number.isNaN(date.getTime())) return undefined;
	return date;
}

function toDateInput(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

function formatRangeLabel(from?: Date, to?: Date) {
	if (from && to) {
		const sameYear = from.getFullYear() === to.getFullYear();
		const left = format(from, sameYear ? 'd MMM' : 'd MMM yyyy');
		const right = format(to, 'd MMM yyyy');
		return `${left} – ${right}`;
	}
	if (from) return format(from, 'd MMM yyyy');
	return null;
}

interface DateRangePickerProps {
	from: string;
	to: string;
	onChange: (next: { from: string; to: string }) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	'aria-label'?: string;
}

export function DateRangePicker({
	from,
	to,
	onChange,
	placeholder = 'Date range',
	disabled,
	className,
	'aria-label': ariaLabel,
}: DateRangePickerProps) {
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState<DateRange | undefined>();

	const applied: DateRange = {
		from: parseDateInput(from),
		to: parseDateInput(to),
	};
	const hasApplied = Boolean(applied.from || applied.to);
	const selected = draft ?? (hasApplied ? applied : undefined);
	const label = formatRangeLabel(applied.from, applied.to);

	const handleOpenChange = (next: boolean) => {
		setDraft(next && hasApplied ? applied : undefined);
		setOpen(next);
	};

	return (
		<Popover open={open} onOpenChange={handleOpenChange} modal>
			<PopoverTrigger asChild>
				<button
					type="button"
					disabled={disabled}
					aria-label={ariaLabel ?? 'Date range'}
					data-empty={!label}
					className={cn(
						'inline-flex h-10 min-h-10 w-full items-center justify-start gap-2 rounded-lg border border-input/20 bg-muted px-3 py-0 text-sm font-normal whitespace-nowrap shadow-xs transition-colors outline-none',
						'hover:bg-muted/80 focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-primary/30',
						'disabled:pointer-events-none disabled:opacity-50',
						!label && 'text-muted-foreground',
						className,
					)}
				>
					<CalendarIcon className="size-4 opacity-70" />
					{label ?? placeholder}
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="range"
					min={1}
					numberOfMonths={2}
					selected={selected}
					captionLayout="dropdown"
					defaultMonth={selected?.from ?? selected?.to}
					onSelect={(range) => {
						if (range?.from && range?.to) {
							setDraft(undefined);
							setOpen(false);
							onChange({ from: toDateInput(range.from), to: toDateInput(range.to) });
							return;
						}
						setDraft(range);
						if (!range?.from && hasApplied) onChange({ from: '', to: '' });
					}}
				/>
			</PopoverContent>
		</Popover>
	);
}
