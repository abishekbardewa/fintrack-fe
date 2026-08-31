import type { LucideIcon } from 'lucide-react';
import {
	Activity,
	ArrowDownLeft,
	ArrowDownRight,
	ArrowUpRight,
	Minus,
	Percent,
	Wallet,
} from 'lucide-react';

import type { DashboardPeriodType, DashboardSummary } from '@/features/dashboard/types';
import { formatMoney } from '@/features/transactions/utils';
import { cn } from '@/lib/utils';

interface DashboardSnapshotCardsProps {
	summary: DashboardSummary;
	currency: string;
	period: DashboardPeriodType;
}

function priorLabel(period: DashboardPeriodType) {
	return period === 'year' ? 'vs last year' : 'vs last month';
}

function Delta({
	value,
	invert,
	compareLabel,
}: {
	value: number | null;
	invert?: boolean;
	compareLabel: string;
}) {
	if (value == null) {
		return (
			<span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
				<Minus className="size-3" aria-hidden="true" />
				{compareLabel}
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
			{flat ? '0%' : `${Math.abs(value)}%`}
			<span className="font-normal text-muted-foreground">{compareLabel}</span>
		</span>
	);
}

export function DashboardSnapshotCards({
	summary,
	currency,
	period,
}: DashboardSnapshotCardsProps) {
	const compareLabel = priorLabel(period);

	const cards: {
		key: string;
		label: string;
		amount: number | null;
		delta: number | null;
		tone: string;
		icon: LucideIcon;
		iconClass: string;
		surface: string;
		invert?: boolean;
		isRate?: boolean;
	}[] = [
		{
			key: 'income',
			label: 'Income',
			amount: summary.income,
			delta: summary.vsPrevious.incomePct,
			tone: 'text-income',
			icon: ArrowDownLeft,
			iconClass: 'text-income/15',
			surface: 'bg-income/5',
		},
		{
			key: 'expense',
			label: 'Spent',
			amount: summary.expense,
			delta: summary.vsPrevious.expensePct,
			tone: 'text-foreground',
			icon: Wallet,
			iconClass: 'text-expense/15',
			surface: 'bg-expense/5',
			invert: true,
		},
		{
			key: 'net',
			label: 'Net Cash Flow',
			amount: summary.periodNet ?? summary.net,
			delta: summary.vsPrevious.netPct,
			tone: (summary.periodNet ?? summary.net) >= 0 ? 'text-income' : 'text-expense',
			icon: Activity,
			iconClass: 'text-primary/10',
			surface: 'bg-muted',
		},
		{
			key: 'rate',
			label: 'Saved',
			amount: summary.savingsRate,
			delta: null,
			tone: 'text-foreground',
			icon: Percent,
			iconClass: 'text-primary/10',
			surface: 'bg-muted',
			isRate: true,
		},
	];

	return (
		<section
			className="grid grid-cols-2 gap-3 lg:grid-cols-4"
			aria-label="Period snapshot"
			data-testid="dashboard-snapshot"
		>
			{cards.map((card) => {
				const Icon = card.icon;

				if (card.key === 'rate' && summary.savingsRate == null) {
					return (
						<article
							key={card.key}
							className={cn(
								'relative overflow-hidden rounded-2xl p-4 shadow-sm',
								card.surface,
							)}
						>
							<Icon
								className={cn(
									'pointer-events-none absolute -right-3 -bottom-3 size-24 rotate-12',
									card.iconClass,
								)}
								aria-hidden="true"
								strokeWidth={1.25}
							/>
							<div className="relative z-10">
								<p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
									{card.label}
								</p>
								<p className="mt-2 text-2xl font-semibold tracking-tight text-muted-foreground tabular-nums">
									—
								</p>
								<p className="mt-2 text-xs text-muted-foreground">No income this period</p>
							</div>
						</article>
					);
				}

				const display =
					card.key === 'rate'
						? `${summary.savingsRate}%`
						: formatMoney(card.amount as number, currency);

				return (
					<article
						key={card.key}
						className={cn(
							'relative overflow-hidden rounded-2xl p-4 shadow-sm',
							card.surface,
						)}
						data-testid={`dashboard-snapshot-${card.key}`}
					>
						<Icon
							className={cn(
								'pointer-events-none absolute -right-3 -bottom-3 size-24 rotate-12',
								card.iconClass,
							)}
							aria-hidden="true"
							strokeWidth={1.25}
						/>
						<div className="relative z-10">
							<p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
								{card.label}
							</p>
							<p
								className={cn(
									'mt-2 text-2xl font-semibold tracking-tight tabular-nums',
									card.tone,
								)}
							>
								{display}
							</p>
							<div className="mt-2">
								{card.key === 'rate' ? (
									<span className="text-xs text-muted-foreground">Of income</span>
								) : (
									<Delta
										value={card.delta}
										invert={card.invert}
										compareLabel={compareLabel}
									/>
								)}
							</div>
						</div>
					</article>
				);
			})}
		</section>
	);
}
