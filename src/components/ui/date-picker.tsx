import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
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

function startOfDay(date: Date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

interface DatePickerProps {
	id?: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	invalid?: boolean;
	className?: string;
	'aria-label'?: string;
	minDate?: Date;
	maxDate?: Date;
}

export function DatePicker({
	id,
	value,
	onChange,
	placeholder = 'Pick a date',
	disabled,
	invalid,
	className,
	'aria-label': ariaLabel,
	minDate,
	maxDate,
}: DatePickerProps) {
	const [open, setOpen] = useState(false);
	const selected = parseDateInput(value);
	const min = minDate ? startOfDay(minDate) : undefined;
	const max = maxDate ? startOfDay(maxDate) : undefined;

	return (
		<Popover open={open} onOpenChange={setOpen} modal>
			<PopoverTrigger asChild>
				<Button
					id={id}
					type="button"
					variant="outline"
					disabled={disabled}
					aria-invalid={invalid}
					aria-label={ariaLabel}
					data-empty={!selected}
					className={cn(
						'h-10 w-full justify-start rounded-lg border border-input/20 bg-muted px-3 text-left font-normal shadow-xs hover:bg-muted/80 dark:border-input/20 dark:bg-muted dark:hover:bg-muted/80',
						!selected && 'text-muted-foreground',
						className,
					)}
				>
					<CalendarIcon className="size-4 opacity-70" />
					{selected ? format(selected, 'MMM d, yyyy') : placeholder}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={selected}
					captionLayout="dropdown"
					defaultMonth={selected ?? max ?? min}
					startMonth={min}
					endMonth={max}
					disabled={(date) => {
						const day = startOfDay(date);
						if (min && day < min) return true;
						if (max && day > max) return true;
						return false;
					}}
					onSelect={(date) => {
						onChange(date ? toDateInput(date) : '');
						setOpen(false);
					}}
				/>
			</PopoverContent>
		</Popover>
	);
}
