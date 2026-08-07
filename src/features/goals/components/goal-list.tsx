import {
	History,
	MoreHorizontal,
	Pencil,
	Plus,
	RotateCcw,
	Trash2,
	XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import type { SavingsGoal } from '@/features/goals/types';
import {
	displayCurrent,
	displayRemaining,
	displayTarget,
	formatDisplayDate,
	statusLabel,
} from '@/features/goals/utils';
import { cn } from '@/lib/utils';

interface GoalListProps {
	goals: SavingsGoal[];
	preferredCurrency: string;
	onContribute: (goal: SavingsGoal) => void;
	onEdit: (goal: SavingsGoal) => void;
	onHistory: (goal: SavingsGoal) => void;
	onCancel: (goal: SavingsGoal) => void;
	onReactivate: (goal: SavingsGoal) => void;
	onDelete: (goal: SavingsGoal) => void;
}

export function GoalList({
	goals,
	preferredCurrency,
	onContribute,
	onEdit,
	onHistory,
	onCancel,
	onReactivate,
	onDelete,
}: GoalListProps) {
	return (
		<div
			className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
			data-testid="goal-list"
		>
			{goals.map((goal) => (
				<GoalCard
					key={goal.id}
					goal={goal}
					preferredCurrency={preferredCurrency}
					onContribute={() => onContribute(goal)}
					onEdit={() => onEdit(goal)}
					onHistory={() => onHistory(goal)}
					onCancel={() => onCancel(goal)}
					onReactivate={() => onReactivate(goal)}
					onDelete={() => onDelete(goal)}
				/>
			))}
		</div>
	);
}

interface GoalCardProps {
	goal: SavingsGoal;
	preferredCurrency: string;
	onContribute: () => void;
	onEdit: () => void;
	onHistory: () => void;
	onCancel: () => void;
	onReactivate: () => void;
	onDelete: () => void;
}

function GoalCard({
	goal,
	preferredCurrency,
	onContribute,
	onEdit,
	onHistory,
	onCancel,
	onReactivate,
	onDelete,
}: GoalCardProps) {
	const percent = Math.min(100, Math.max(0, goal.percent));
	const canContribute = goal.status === 'active' || goal.status === 'completed';

	return (
		<article
			className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-balance-soft shadow-sm"
			data-testid={`goal-card-${goal.id}`}
		>
			<div className="flex items-start gap-3 px-4 pt-4 pb-3">
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="truncate text-sm font-semibold text-foreground">{goal.name}</h3>
						<StatusBadge status={goal.status} />
					</div>
					{goal.targetDate ? (
						<p className="mt-1 text-xs text-muted-foreground">
							Target {formatDisplayDate(goal.targetDate)}
						</p>
					) : (
						<p className="mt-1 text-xs text-muted-foreground">No target date</p>
					)}
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button type="button" variant="ghost" size="icon-sm" aria-label="Goal actions">
							<MoreHorizontal />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{canContribute ? (
							<DropdownMenuItem onClick={onContribute}>
								<Plus />
								Add contribution
							</DropdownMenuItem>
						) : null}
						<DropdownMenuItem onClick={onHistory}>
							<History />
							Contributions
						</DropdownMenuItem>
						<DropdownMenuItem onClick={onEdit}>
							<Pencil />
							Edit
						</DropdownMenuItem>
						{goal.status === 'active' || goal.status === 'completed' ? (
							<DropdownMenuItem onClick={onCancel}>
								<XCircle />
								Mark cancelled
							</DropdownMenuItem>
						) : null}
						{goal.status === 'cancelled' ? (
							<DropdownMenuItem onClick={onReactivate}>
								<RotateCcw />
								Reactivate
							</DropdownMenuItem>
						) : null}
						<DropdownMenuSeparator />
						<DropdownMenuItem variant="destructive" onClick={onDelete}>
							<Trash2 />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className="flex flex-1 flex-col gap-3 px-4 pb-4">
				<div className="space-y-2">
					<div className="flex items-baseline justify-between gap-2 text-sm">
						<span className="font-semibold tabular-nums text-foreground">
							{displayCurrent(goal, preferredCurrency)}
						</span>
						<span className="text-muted-foreground tabular-nums">
							of {displayTarget(goal, preferredCurrency)}
						</span>
					</div>
					<Progress value={percent} aria-label={`${percent}% complete`} />
					<div className="flex justify-between gap-2 text-xs text-muted-foreground">
						<span className="tabular-nums">{percent.toFixed(0)}%</span>
						<span className="tabular-nums">{displayRemaining(goal)} left</span>
					</div>
				</div>

				{canContribute ? (
					<Button
						type="button"
						variant="secondary"
						size="sm"
						className="mt-auto w-full"
						onClick={onContribute}
						data-testid={`goal-contribute-${goal.id}`}
					>
						<Plus className="size-3.5" />
						Contribute
					</Button>
				) : null}
			</div>
		</article>
	);
}

function StatusBadge({ status }: { status: SavingsGoal['status'] }) {
	return (
		<Badge
			variant="outline"
			className={cn(
				'font-medium',
				status === 'active' && 'border-primary/30 bg-primary/10 text-primary',
				status === 'completed' && 'border-income/30 bg-income/10 text-income',
				status === 'cancelled' && 'border-border bg-muted text-muted-foreground',
			)}
		>
			{statusLabel(status)}
		</Badge>
	);
}
