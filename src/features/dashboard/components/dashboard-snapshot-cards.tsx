import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

import type { DashboardSummary } from '@/features/dashboard/types';
import { formatMoney } from '@/features/transactions/utils';
import { cn } from '@/lib/utils';

interface DashboardSnapshotCardsProps {
	summary: DashboardSummary;
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

export function DashboardSnapshotCards({ summary, currency }: DashboardSnapshotCardsProps) {
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
		},
		{
			key: 'net',
			label: 'Net',
			amount: summary.net,
			delta: summary.vsPrevious.netPct,
			tone: summary.net >= 0 ? 'text-income' : 'text-expense',
		},
		{
			key: 'rate',
			label: 'Saved',
			amount: summary.savingsRate,
			delta: null as number | null,
			tone: 'text-foreground',
			isRate: true,
		},
	] as const;

	return (
		<section
			className="grid grid-cols-2 gap-3 lg:grid-cols-4"
			aria-label="Period snapshot"
			data-testid="dashboard-snapshot"
		>
			{cards.map((card) => {
				if (card.key === 'rate' && summary.savingsRate == null) {
					return (
						<article
							key={card.key}
							className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
						>
							<p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
								{card.label}
							</p>
							<p className="mt-2 text-2xl font-semibold tracking-tight text-muted-foreground tabular-nums">
								—
							</p>
							<p className="mt-2 text-xs text-muted-foreground">No income this period</p>
						</article>
					);
				}

				const display =
					card.key === 'rate'
						? `${summary.savingsRate!.toFixed(1)}%`
						: formatMoney(card.amount as number, currency);

				return (
					<article
						key={card.key}
						className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
						data-testid={`dashboard-snapshot-${card.key}`}
					>
						<p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
							{card.label}
						</p>
						<p className={cn('mt-2 text-2xl font-semibold tracking-tight tabular-nums', card.tone)}>
							{display}
						</p>
						<div className="mt-2">
							{card.key === 'rate' ? (
								<span className="text-xs text-muted-foreground">Of income</span>
							) : (
								<Delta value={card.delta} invert={card.key === 'expense'} />
							)}
						</div>
					</article>
				);
			})}
		</section>
	);
}
