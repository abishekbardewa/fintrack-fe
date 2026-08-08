import { Link } from 'react-router-dom';
import { Target } from 'lucide-react';

import { Progress } from '@/components/ui/progress';
import type { DashboardGoalRow } from '@/features/dashboard/types';
import { formatMoney } from '@/features/transactions/utils';

interface DashboardGoalsStripProps {
	goals: DashboardGoalRow[];
	currency: string;
}

export function DashboardGoalsStrip({ goals, currency }: DashboardGoalsStripProps) {
	const rows = goals.slice(0, 3);

	if (rows.length === 0) return null;

	return (
		<div className="space-y-3" data-testid="dashboard-goals-strip">
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
				{rows.map((goal) => (
					<article
						key={goal.id}
						className="relative overflow-hidden rounded-2xl bg-muted p-4 shadow-sm"
						data-testid={`dashboard-goal-${goal.id}`}
					>
						<Target
							className="pointer-events-none absolute -right-3 -bottom-3 size-24 rotate-12 text-primary/10"
							aria-hidden="true"
							strokeWidth={1.25}
						/>
						<div className="relative z-10">
							<div className="flex items-start justify-between gap-2">
								<h3 className="truncate text-sm font-semibold text-foreground">{goal.name}</h3>
								<span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
									{goal.percent.toFixed(0)}%
								</span>
							</div>
							<p className="mt-1 text-xs text-muted-foreground tabular-nums">
								{formatMoney(goal.current, currency)} / {formatMoney(goal.target, currency)}
							</p>
							<Progress value={Math.min(100, goal.percent)} className="mt-3 h-2" />
							<p className="mt-2 text-xs text-muted-foreground">
								{formatMoney(goal.remaining, currency)} left
								{goal.daysLeft != null ? ` · ${goal.daysLeft}d` : ''}
							</p>
						</div>
					</article>
				))}
			</div>
			<div className="text-right">
				<Link
					to="/goals"
					className="text-sm font-medium text-primary underline-offset-4 hover:underline"
				>
					View goals
				</Link>
			</div>
		</div>
	);
}
