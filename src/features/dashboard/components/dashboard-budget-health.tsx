import { Link } from 'react-router-dom';
import { ChartPie, Wallet } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { DashboardBudgetRow, DashboardBudgetStatus } from '@/features/dashboard/types';
import { formatMoney } from '@/features/transactions/utils';
import { cn } from '@/lib/utils';

interface DashboardBudgetHealthProps {
	budgets: DashboardBudgetRow[];
	currency: string;
}

function statusLabel(status: DashboardBudgetStatus) {
	switch (status) {
		case 'ok':
			return 'On track';
		case 'warning':
			return 'Near limit';
		case 'over':
			return 'Over';
	}
}

function statusClass(status: DashboardBudgetStatus) {
	switch (status) {
		case 'ok':
			return 'bg-primary/10 text-primary border-transparent';
		case 'warning':
			return 'bg-amber-500/15 text-amber-700 border-transparent dark:text-amber-300';
		case 'over':
			return 'bg-expense/15 text-expense border-transparent';
	}
}

function featureStatusClass(status: DashboardBudgetStatus) {
	switch (status) {
		case 'ok':
			return 'border-feature-foreground/25 bg-feature-foreground/10 text-feature-foreground';
		case 'warning':
			return 'border-amber-300/40 bg-amber-300/15 text-amber-100';
		case 'over':
			return 'border-red-300/40 bg-red-300/15 text-red-100';
	}
}

function progressClass(status: DashboardBudgetStatus, feature: boolean) {
	if (feature) {
		switch (status) {
			case 'ok':
				return 'bg-feature-foreground';
			case 'warning':
				return 'bg-amber-300';
			case 'over':
				return 'bg-red-300';
		}
	}
	switch (status) {
		case 'ok':
			return 'bg-primary';
		case 'warning':
			return 'bg-amber-500';
		case 'over':
			return 'bg-expense';
	}
}

const STATUS_ORDER: Record<DashboardBudgetStatus, number> = {
	over: 0,
	warning: 1,
	ok: 2,
};

function pickBudget(budgets: DashboardBudgetRow[]) {
	const overall = budgets.find((b) => b.categoryId == null);
	if (overall) return overall;
	return [...budgets].sort(
		(a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.percent - a.percent,
	)[0];
}

export function DashboardBudgetHealth({ budgets, currency }: DashboardBudgetHealthProps) {
	const budget = pickBudget(budgets);

	if (!budget) {
		return (
			<div
				className="rounded-2xl border border-dashed border-border/70 bg-card/50 px-4 py-8 text-center"
				data-testid="dashboard-budget-health"
			>
				<p className="text-sm text-muted-foreground">No budgets this month.</p>
				<Link
					to="/budgets"
					className="mt-2 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
				>
					Set a budget
				</Link>
			</div>
		);
	}

	const isAllExpenses = budget.categoryId == null;
	const title = isAllExpenses ? 'All expenses' : budget.name;

	return (
		<article
			className={cn(
				'relative overflow-hidden rounded-2xl p-4 shadow-sm',
				isAllExpenses
					? 'bg-feature text-feature-foreground shadow-feature/25'
					: 'bg-muted',
			)}
			data-testid="dashboard-budget-health"
		>
			{isAllExpenses ? (
				<ChartPie
					className="pointer-events-none absolute -right-3 -bottom-3 size-24 rotate-12 text-feature-foreground/10"
					aria-hidden="true"
					strokeWidth={1.25}
				/>
			) : (
				<Wallet
					className="pointer-events-none absolute -right-3 -bottom-3 size-24 rotate-12 text-primary/10"
					aria-hidden="true"
					strokeWidth={1.25}
				/>
			)}

			<div className="relative z-10">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-2">
							<h3
								className={cn(
									'truncate text-sm font-semibold',
									isAllExpenses ? 'text-feature-foreground' : 'text-foreground',
								)}
							>
								{title}
							</h3>
							<Badge
								className={cn(
									isAllExpenses
										? featureStatusClass(budget.status)
										: statusClass(budget.status),
								)}
							>
								{statusLabel(budget.status)}
							</Badge>
						</div>
						<p
							className={cn(
								'mt-1 text-xs tabular-nums',
								isAllExpenses ? 'text-feature-foreground/70' : 'text-muted-foreground',
							)}
						>
							{formatMoney(budget.spent, currency)} of {formatMoney(budget.limit, currency)}
						</p>
					</div>
					<p
						className={cn(
							'shrink-0 text-sm font-semibold tabular-nums',
							isAllExpenses ? 'text-feature-foreground' : 'text-foreground',
						)}
					>
						{budget.percent.toFixed(0)}%
					</p>
				</div>
				<Progress
					value={Math.min(100, budget.percent)}
					className={cn('mt-3 h-2', isAllExpenses && 'bg-feature-foreground/20')}
					indicatorClassName={progressClass(budget.status, isAllExpenses)}
				/>
			</div>
		</article>
	);
}
