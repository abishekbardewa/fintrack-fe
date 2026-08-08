import { Link } from 'react-router-dom';

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

function progressClass(status: DashboardBudgetStatus) {
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

export function DashboardBudgetHealth({ budgets, currency }: DashboardBudgetHealthProps) {
	const sorted = [...budgets]
		.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.percent - a.percent)
		.slice(0, 4);

	if (sorted.length === 0) {
		return (
			<div className="rounded-2xl border border-dashed border-border/70 bg-card/50 px-4 py-8 text-center">
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

	return (
		<div className="space-y-3" data-testid="dashboard-budget-health">
			{sorted.map((budget) => (
				<article
					key={budget.id}
					className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
					data-testid={`dashboard-budget-${budget.id}`}
				>
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<div className="flex flex-wrap items-center gap-2">
								<h3 className="truncate text-sm font-semibold text-foreground">{budget.name}</h3>
								<Badge className={cn(statusClass(budget.status))}>{statusLabel(budget.status)}</Badge>
							</div>
							<p className="mt-1 text-xs text-muted-foreground tabular-nums">
								{formatMoney(budget.spent, currency)} of {formatMoney(budget.limit, currency)}
							</p>
						</div>
						<p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
							{budget.percent.toFixed(0)}%
						</p>
					</div>
					<Progress
						value={Math.min(100, budget.percent)}
						className="mt-3 h-2"
						indicatorClassName={progressClass(budget.status)}
					/>
				</article>
			))}
			<div className="text-right">
				<Link
					to="/budgets"
					className="text-sm font-medium text-primary underline-offset-4 hover:underline"
				>
					View budgets
				</Link>
			</div>
		</div>
	);
}
