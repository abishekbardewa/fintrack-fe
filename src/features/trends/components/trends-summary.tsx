import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

import type { TrendsSummary } from '@/features/trends/types';
import { formatMoney } from '@/features/transactions/utils';
import { cn } from '@/lib/utils';

interface TrendsSummaryCardsProps {
	summary: TrendsSummary;
	currency: string;
}

function Delta({ value, invert }: { value: number | null; invert?: boolean }) {
	if (value == null) {
		return (
			<span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
				<Minus className="size-3" aria-hidden="true" />
				vs prior
			</span>
		);
	}

	const up = value > 0;
	const flat = value === 0;
	const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
	const positive = invert ? !up : up;

	return (
		<span
			className={cn(
				'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
				flat && 'text-muted-foreground',
				!flat && positive && 'text-income',
				!flat && !positive && 'text-expense',
			)}
		>
			<Icon className="size-3.5" aria-hidden="true" />
			{flat ? '0%' : `${Math.abs(value).toFixed(1)}%`}
			<span className="font-normal text-muted-foreground">vs prior</span>
		</span>
	);
}

export function TrendsSummaryCards({ summary, currency }: TrendsSummaryCardsProps) {
	const cards = [
		{
			key: 'income',
			label: 'Income',
			amount: summary.income,
			delta: summary.vsPrevious.incomePct,
			tone: 'text-income',
		},
		{
			key: 'expense',
			label: 'Spent',
			amount: summary.expense,
			delta: summary.vsPrevious.expensePct,
			tone: 'text-foreground',
			invert: true,
		},
		{
			key: 'net',
			label: 'Net',
			amount: summary.net,
			delta: summary.vsPrevious.netPct,
			tone: summary.net >= 0 ? 'text-income' : 'text-expense',
		},
	] as const;

	return (
		<section className="grid grid-cols-1 gap-3 sm:grid-cols-3" data-testid="trends-summary">
			{cards.map((card) => (
				<article
					key={card.key}
					className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
					data-testid={`trends-summary-${card.key}`}
				>
					<p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						{card.label}
					</p>
					<p className={cn('mt-2 text-2xl font-semibold tracking-tight tabular-nums', card.tone)}>
						{formatMoney(card.amount, currency)}
					</p>
					<div className="mt-2">
						<Delta value={card.delta} invert={'invert' in card ? card.invert : false} />
					</div>
				</article>
			))}
		</section>
	);
}
