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
	const goal = goals[0];

	if (!goal) {
		return (
			<div
				className="rounded-2xl border border-dashed border-border/70 bg-card/50 px-4 py-8 text-center"
				data-testid="dashboard-goals-strip"
			>
				<p className="text-sm text-muted-foreground">No goals yet.</p>
				<Link
					to="/goals"
					className="mt-2 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
				>
					Set a goal
				</Link>
			</div>
		);
	}

	return (
		<article
			className="relative overflow-hidden rounded-2xl bg-muted p-4 shadow-sm"
			data-testid="dashboard-goals-strip"
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
						{goal.percent}%
					</span>
				</div>
				<p className="mt-1 text-xs text-muted-foreground tabular-nums">
					<span className="text-foreground">{formatMoney(goal.current, currency)}</span>
					{' Goal Balance · '}
					<span className="text-foreground">{formatMoney(goal.target, currency)}</span> Target
				</p>
				<Progress value={Math.min(100, goal.percent)} className="mt-3 h-2" />
				<p className="mt-2 text-xs text-muted-foreground">
					{formatMoney(goal.remaining, currency)} Remaining
					{goal.daysLeft != null ? ` · ${goal.daysLeft}d` : ''}
				</p>
			</div>
		</article>
	);
}
