import { useMemo, useState } from 'react';
import { format, isSameDay, isSameMonth, startOfDay, startOfMonth } from 'date-fns';
import { Hash, TrendingDown, TrendingUp } from 'lucide-react';

import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTransactionMonthSummaryQuery } from '@/features/transactions/hooks/use-transactions';
import type { TransactionMonthSummaryTotals } from '@/features/transactions/types';
import { formatMoney } from '@/features/transactions/utils';
import { cn } from '@/lib/utils';

type DaySummary = TransactionMonthSummaryTotals;

function dayKey(date: Date) {
	return format(date, 'yyyy-MM-dd');
}

function Metric({
	icon: Icon,
	label,
	value,
	tone,
}: {
	icon: typeof TrendingDown;
	label: string;
	value: string;
	tone?: string;
}) {
	return (
		<div className="flex min-w-0 items-center gap-1.5">
			<Tooltip>
				<TooltipTrigger asChild>
					<span
						className={cn(
							'inline-flex size-5 shrink-0 items-center justify-center rounded-full',
							tone ?? 'text-muted-foreground',
						)}
					>
						<Icon className="size-3.5" aria-hidden="true" />
						<span className="sr-only">{label}</span>
					</span>
				</TooltipTrigger>
				<TooltipContent sideOffset={6}>{label}</TooltipContent>
			</Tooltip>
			<span className={cn('truncate text-sm font-semibold tabular-nums', tone ?? 'text-foreground')}>
				{value}
			</span>
		</div>
	);
}

function SummaryBlock({
	summary,
	currency,
	emptyLabel,
	scopeLabel,
	heading,
}: {
	summary: DaySummary | null;
	currency: string;
	emptyLabel?: string;
	scopeLabel: string;
	heading?: string;
}) {
	if (!summary || summary.count === 0) {
		return (
			<div className="rounded-lg bg-muted/50 px-3 py-2.5">
				{heading ? (
					<p className="mb-1.5 text-xs text-muted-foreground">{heading}</p>
				) : null}
				<p className="text-sm text-muted-foreground">{emptyLabel ?? 'No transactions'}</p>
			</div>
		);
	}

	return (
		<div className="rounded-lg bg-muted/50 px-3 py-2.5">
			{heading ? (
				<p className="mb-1.5 text-xs text-muted-foreground">{heading}</p>
			) : null}
			<div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
				<Metric
					icon={TrendingDown}
					label={`Total spent ${scopeLabel}`}
					value={formatMoney(summary.spent, currency)}
					tone="text-expense"
				/>
				<span className="text-muted-foreground" aria-hidden="true">
					·
				</span>
				<Metric
					icon={TrendingUp}
					label={`Total income ${scopeLabel}`}
					value={formatMoney(summary.income, currency)}
					tone={summary.income > 0 ? 'text-income' : 'text-muted-foreground'}
				/>
				<span className="text-muted-foreground" aria-hidden="true">
					·
				</span>
				<Metric
					icon={Hash}
					label={`Total transactions ${scopeLabel}`}
					value={`${summary.count} tx`}
				/>
			</div>
		</div>
	);
}

interface TransactionPulseProps {
	currency: string;
}

export function TransactionPulse({ currency }: TransactionPulseProps) {
	const today = useMemo(() => startOfDay(new Date()), []);
	const currentMonth = useMemo(() => startOfMonth(today), [today]);
	const [selected, setSelected] = useState<Date>(today);

	const year = currentMonth.getFullYear();
	const month = currentMonth.getMonth() + 1;
	const { data, isPending, isError } = useTransactionMonthSummaryQuery({ year, month });

	const displayCurrency = data?.currency || currency;
	const dayMap = useMemo(() => {
		const map: Record<string, DaySummary> = {};
		for (const day of data?.days ?? []) {
			map[day.date] = { spent: day.spent, income: day.income, count: day.count };
		}
		return map;
	}, [data?.days]);

	const monthSummary = data?.monthTotals ?? null;
	const selectedSummary = selected ? (dayMap[dayKey(selected)] ?? null) : null;
	const activityDates = useMemo(
		() => Object.keys(dayMap).map((key) => startOfDay(new Date(`${key}T12:00:00`))),
		[dayMap],
	);

	const monthLabel = format(currentMonth, 'MMMM yyyy');
	const dayHeading =
		selected && isSameDay(selected, today)
			? `Today · ${format(selected, 'd MMM')}`
			: selected
				? format(selected, 'd MMM yyyy')
				: 'Selected day';
	const dayScopeLabel =
		selected && isSameDay(selected, today)
			? 'today'
			: selected
				? format(selected, 'd MMM yyyy')
				: 'this day';

	return (
		<section
			className="overflow-hidden rounded-xl border border-border/60 bg-card p-3 shadow-xs"
			aria-label="Quick overview"
			data-testid="transaction-pulse"
		>
			<h2 className="px-1 text-sm font-semibold tracking-tight text-foreground">
				Quick overview
				<span className="font-normal text-muted-foreground"> · {monthLabel}</span>
			</h2>

			{isPending ? (
				<div className="mt-3 flex flex-col gap-3">
					<Skeleton className="h-11 w-full rounded-lg" />
					<Skeleton className="h-56 w-full rounded-lg" />
					<Skeleton className="h-16 w-full rounded-lg" />
				</div>
			) : isError ? (
				<p className="mt-3 px-1 text-sm text-muted-foreground">Could not load overview.</p>
			) : (
				<div className="mt-3 flex flex-col gap-3">
					<SummaryBlock
						summary={monthSummary}
						currency={displayCurrency}
						emptyLabel="Nothing this month"
						scopeLabel="this month"
					/>

					<div className="mt-3">
						<Calendar
							mode="single"
							month={currentMonth}
							onMonthChange={() => undefined}
							selected={selected}
							onSelect={(date) => {
								if (!date) return;
								if (!isSameMonth(date, currentMonth)) return;
								setSelected(startOfDay(date));
							}}
							startMonth={currentMonth}
							endMonth={currentMonth}
							hideNavigation
							showOutsideDays={false}
							className="w-full bg-transparent p-0 [--cell-size:--spacing(7)]"
							classNames={{
								month_caption: 'hidden',
								nav: 'hidden',
							}}
							modifiers={{
								hasActivity: activityDates,
							}}
							modifiersClassNames={{
								hasActivity:
									'[&_button]:relative [&_button]:after:absolute [&_button]:after:bottom-1 [&_button]:after:left-1/2 [&_button]:after:size-1 [&_button]:after:-translate-x-1/2 [&_button]:after:rounded-full [&_button]:after:bg-primary',
							}}
						/>
					</div>

					<SummaryBlock
						summary={selectedSummary}
						currency={displayCurrency}
						scopeLabel={dayScopeLabel}
						heading={dayHeading}
					/>
				</div>
			)}
		</section>
	);
}
