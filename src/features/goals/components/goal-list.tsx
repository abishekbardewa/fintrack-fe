import {
	History,
	MoreHorizontal,
	Pencil,
	Plus,
	RotateCcw,
	Target,
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
import type { SavingsGoal, SavingsGoalStatus } from '@/features/goals/types';
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

const STATUS_ORDER: Record<SavingsGoalStatus, number> = {
	active: 0,
	completed: 1,
	cancelled: 2,
};

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
	const sorted = [...goals].sort(
		(a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
	);

	return (
		<div
			className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
			data-testid="goal-list"
		>
			{sorted.map((goal) => (
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
	const isActive = goal.status === 'active';

	return (
		<article
			className="relative flex flex-col overflow-hidden rounded-3xl bg-muted shadow-sm"
			data-testid={`goal-card-${goal.id}`}
		>
			{isActive ? (
				<Target
					className="pointer-events-none absolute -right-4 -bottom-4 size-36 rotate-12 text-primary/15"
					aria-hidden="true"
					strokeWidth={1.25}
				/>
			) : null}

			<div className="relative z-10 flex items-start gap-3 px-5 pt-5 pb-3">
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="truncate text-sm font-semibold text-foreground">{goal.name}</h3>
						<StatusBadge status={goal.status} />
					</div>
					<p className="mt-1 text-xs text-muted-foreground">
						{goal.targetDate
							? `Target ${formatDisplayDate(goal.targetDate)}`
							: 'No target date'}
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-0.5">
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label="Contribution history"
						onClick={onHistory}
						data-testid={`goal-history-${goal.id}`}
					>
						<History />
					</Button>
					<GoalActions
						status={goal.status}
						onEdit={onEdit}
						onCancel={onCancel}
						onReactivate={onReactivate}
						onDelete={onDelete}
					/>
				</div>
			</div>

			<div className="relative z-10 flex flex-1 flex-col gap-3 px-5 pb-5">
				<div className="flex items-end gap-2">
					<span className="text-4xl font-bold tracking-tight text-foreground tabular-nums">
						{percent}%
					</span>
					<span className="mb-1 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
						Saved
					</span>
				</div>

				<div className="flex items-baseline justify-between gap-2 text-sm">
					<span className="font-semibold tabular-nums text-foreground">
						{displayCurrent(goal, preferredCurrency)}
					</span>
					<span className="text-muted-foreground tabular-nums">
						of {displayTarget(goal, preferredCurrency)}
					</span>
				</div>

				<Progress
					value={percent}
					className={cn(
						goal.status === 'completed' && 'bg-income/20',
						goal.status === 'cancelled' && 'bg-muted-foreground/15',
					)}
					indicatorClassName={cn(
						goal.status === 'completed' && 'bg-income',
						goal.status === 'cancelled' && 'bg-muted-foreground',
					)}
					aria-label={`${percent}% complete`}
				/>

				<div className="flex justify-end text-xs text-muted-foreground">
					<span className="tabular-nums">{displayRemaining(goal)} left</span>
				</div>

				{canContribute ? (
					<Button
						type="button"
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

function GoalActions({
	status,
	onEdit,
	onCancel,
	onReactivate,
	onDelete,
}: {
	status: SavingsGoal['status'];
	onEdit: () => void;
	onCancel: () => void;
	onReactivate: () => void;
	onDelete: () => void;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button type="button" variant="ghost" size="icon-sm" aria-label="Goal actions">
					<MoreHorizontal />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={onEdit}>
					<Pencil />
					Edit
				</DropdownMenuItem>
				{status === 'active' || status === 'completed' ? (
					<DropdownMenuItem onClick={onCancel}>
						<XCircle />
						Mark cancelled
					</DropdownMenuItem>
				) : null}
				{status === 'cancelled' ? (
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
				status === 'cancelled' && 'border-border bg-background text-muted-foreground',
			)}
		>
			{statusLabel(status)}
		</Badge>
	);
}
